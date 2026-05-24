"use strict";
/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSteamCmdBranches = exports.resolveSteamCmdPath = exports.resolveBranchById = exports.getAvailableBuilds = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const paths_1 = require("../config/paths");
const errors_1 = require("../utils/errors");
const execFilePromise = (0, util_1.promisify)(child_process_1.execFile);
// Cache variables
let branchesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const FALLBACK_BRANCHES_PATH = path.join(paths_1.PZWEBADMIN_ROOT, 'backend/config/zomboid-branches.json');
const DEFAULT_FALLBACK_BRANCHES = [
    {
        id: 'public',
        label: 'Public / Stable',
        description: 'Default stable Project Zomboid server branch',
        steamBranch: '',
        requiresPassword: false,
        default: true
    },
    {
        id: 'unstable',
        label: 'Unstable',
        description: 'Unstable testing branch',
        steamBranch: 'unstable',
        requiresPassword: false,
        default: false
    },
    {
        id: 'b41multiplayer',
        label: 'Build 41 Multiplayer',
        description: 'Legacy Build 41 multiplayer branch',
        steamBranch: 'b41multiplayer',
        requiresPassword: false,
        default: false
    }
];
/**
 * Fetch available branches for Project Zomboid (AppID 380870) using SteamCMD
 */
const getAvailableBuilds = async () => {
    // Check Cache
    if (branchesCache && (Date.now() - cacheTimestamp < CACHE_TTL_MS)) {
        return branchesCache;
    }
    const fallback = await loadFallbackBranches();
    try {
        const steamCmdInfo = await (0, exports.resolveSteamCmdPath)();
        console.info(`[versions] steamcmdPath=${steamCmdInfo.path}`);
        console.info(`[versions] steamcmdExists=${steamCmdInfo.exists} steamcmdExecutable=${steamCmdInfo.executable}`);
        if (!steamCmdInfo.exists || !steamCmdInfo.executable) {
            if (!fallback.length) {
                throw new errors_1.AppError('SteamCMD is not installed or not executable and fallback branch list is empty.', 'STEAMCMD_NOT_FOUND', 500);
            }
            console.warn('[versions] Using fallback branches because SteamCMD is unavailable.');
            const result = {
                source: 'fallback',
                data: fallback
            };
            branchesCache = result;
            cacheTimestamp = Date.now();
            return result;
        }
        // Run steamcmd to print app info for Project Zomboid dedicated server
        const { stdout } = await execFilePromise(steamCmdInfo.path, [
            '+login', 'anonymous',
            '+app_info_update', '1',
            '+app_info_print', '380870',
            '+quit'
        ]);
        // Log raw SteamCMD output for debugging
        const logPath = path.join('/opt/pzwebadmin/backend/logs', 'steamcmd-raw-output.log');
        await fs.writeFile(logPath, stdout, 'utf-8');
        const steamBranches = (0, exports.parseSteamCmdBranches)(stdout);
        console.info(`[versions] steamcmdParsedBranches=${steamBranches.length}`);
        const steamOptions = mapSteamBranchesToOptions(steamBranches);
        const merged = mergeBranchOptions(steamOptions, fallback);
        if (!steamOptions.length && !fallback.length) {
            throw new errors_1.AppError('SteamCMD did not return branches and fallback branch list is empty.', 'INSTALL_FAILED', 500);
        }
        const source = steamOptions.length > 0 && fallback.length > 0
            ? (merged.length > steamOptions.length ? 'mixed' : 'steamcmd')
            : steamOptions.length > 0
                ? 'steamcmd'
                : 'fallback';
        if (!steamOptions.length && fallback.length) {
            console.warn('[versions] SteamCMD returned empty branch list. Using fallback branches.');
        }
        if (source === 'mixed') {
            console.info('[versions] Using mixed branch catalog (SteamCMD + fallback).');
        }
        const result = { source, data: merged };
        // Update cache
        branchesCache = result;
        cacheTimestamp = Date.now();
        return result;
    }
    catch (error) {
        console.error('[versions] Failed to get available builds from SteamCMD:', error);
        if (!fallback.length) {
            throw error;
        }
        console.warn('[versions] Falling back to local branch list after SteamCMD error.');
        const result = {
            source: 'fallback',
            data: fallback
        };
        branchesCache = result;
        cacheTimestamp = Date.now();
        return result;
    }
};
exports.getAvailableBuilds = getAvailableBuilds;
// Loads fallback branches from local config/zomboid-branches.json
async function loadFallbackBranches() {
    try {
        const data = await fs.readFile(FALLBACK_BRANCHES_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) {
            return DEFAULT_FALLBACK_BRANCHES;
        }
        const normalized = parsed
            .filter((entry) => typeof entry.id === 'string' && entry.id.trim().length > 0)
            .map((entry) => {
            const id = entry.id.trim();
            return {
                id,
                label: typeof entry.label === 'string' && entry.label.trim().length > 0
                    ? entry.label
                    : id === 'public'
                        ? 'Public / Stable'
                        : id,
                description: typeof entry.description === 'string' ? entry.description : '',
                steamBranch: typeof entry.steamBranch === 'string' ? entry.steamBranch : (id === 'public' ? '' : id),
                requiresPassword: Boolean(entry.requiresPassword),
                default: Boolean(entry.default),
                buildid: typeof entry.buildid === 'string' ? entry.buildid : undefined
            };
        });
        return normalized.length > 0 ? normalized : DEFAULT_FALLBACK_BRANCHES;
    }
    catch (e) {
        console.error('[versions] Failed to load fallback branches from config/zomboid-branches.json:', e);
        return DEFAULT_FALLBACK_BRANCHES;
    }
}
const mapSteamBranchesToOptions = (branches) => {
    return branches.map((branch) => {
        const id = branch.name;
        const isPublic = id === 'public';
        return {
            id,
            label: isPublic ? 'Public / Stable' : id,
            description: branch.description || (isPublic ? 'Default stable Project Zomboid server branch' : `Steam branch ${id}`),
            steamBranch: isPublic ? '' : id,
            requiresPassword: Boolean(branch.pwdrequired),
            default: isPublic,
            buildid: branch.buildid || undefined
        };
    });
};
const mergeBranchOptions = (steamOptions, fallbackOptions) => {
    if (!steamOptions.length) {
        return fallbackOptions;
    }
    const byId = new Map();
    for (const steam of steamOptions) {
        const fallback = fallbackOptions.find((f) => f.id === steam.id);
        byId.set(steam.id, {
            ...steam,
            label: fallback?.label || steam.label,
            description: fallback?.description || steam.description,
            requiresPassword: fallback?.requiresPassword ?? steam.requiresPassword,
            default: fallback?.default ?? steam.default,
            steamBranch: steam.steamBranch,
            buildid: steam.buildid || fallback?.buildid
        });
    }
    const merged = Array.from(byId.values());
    const defaultIndex = merged.findIndex((branch) => branch.default);
    if (defaultIndex > 0) {
        const [defaultBranch] = merged.splice(defaultIndex, 1);
        merged.unshift(defaultBranch);
    }
    return merged;
};
const resolveBranchById = async (branchId, options) => {
    const normalizedId = typeof branchId === 'string' ? branchId.trim() : '';
    if (!normalizedId) {
        throw new errors_1.AppError('Branch ID is required.', 'INVALID_BRANCH', 400);
    }
    const catalog = await (0, exports.getAvailableBuilds)();
    const resolved = catalog.data.find((branch) => branch.id === normalizedId);
    if (!resolved) {
        // Backward-compat alias resolution for legacy branch IDs that may have been renamed upstream.
        const legacyPatterns = {
            b41multiplayer: [/legacy.*41/i, /^legacy41/i, /\b41\b/i]
        };
        const candidates = legacyPatterns[normalizedId];
        if (candidates && catalog.data.length > 0) {
            const alias = catalog.data.find((branch) => candidates.some((pattern) => pattern.test(branch.id)));
            if (alias) {
                console.warn(`[versions] Branch '${normalizedId}' is deprecated/unavailable. Using '${alias.id}' as compatibility alias.`);
                return alias;
            }
        }
        if (options?.allowUnknown) {
            if (!/^[a-zA-Z0-9._-]{1,64}$/.test(normalizedId)) {
                throw new errors_1.AppError(`Branch '${normalizedId}' has an invalid format.`, 'INVALID_BRANCH', 400);
            }
            console.warn(`[versions] Using manually provided branch '${normalizedId}' not present in catalog.`);
            return {
                id: normalizedId,
                label: normalizedId,
                description: 'Manually provided branch identifier',
                steamBranch: normalizedId === 'public' ? '' : normalizedId,
                requiresPassword: false,
                default: normalizedId === 'public'
            };
        }
        throw new errors_1.AppError(`Branch '${normalizedId}' is not available.`, 'INVALID_BRANCH', 400);
    }
    return resolved;
};
exports.resolveBranchById = resolveBranchById;
const resolveSteamCmdPath = async () => {
    const configuredPath = process.env.PZ_STEAMCMD_PATH?.trim();
    const candidate = configuredPath && configuredPath.length > 0 ? configuredPath : paths_1.STEAMCMD_PATH;
    let exists = false;
    let executable = false;
    try {
        await fs.access(candidate, fs_1.constants.F_OK);
        exists = true;
    }
    catch {
        exists = false;
    }
    if (exists) {
        try {
            await fs.access(candidate, fs_1.constants.X_OK);
            executable = true;
        }
        catch {
            executable = false;
        }
    }
    return {
        path: candidate,
        exists,
        executable
    };
};
exports.resolveSteamCmdPath = resolveSteamCmdPath;
/**
 * Parse SteamCMD app_info_print output to extract branches
 */
const parseSteamCmdBranches = (output) => {
    const branches = [];
    // Look for the branches block in VDF output
    const branchesBlockMatch = output.match(/"branches"\s*\{([\s\S]*?)\n\s*\}/);
    if (!branchesBlockMatch)
        return branches;
    const branchesBlock = branchesBlockMatch[1];
    // Extract each branch block
    const branchRegex = /"([^"]+)"\s*\{([^}]+)\}/g;
    let match;
    while ((match = branchRegex.exec(branchesBlock)) !== null) {
        const branchName = match[1];
        const propertiesBlock = match[2];
        // Extract properties
        const buildidMatch = propertiesBlock.match(/"buildid"\s*"([^"]+)"/);
        const timeupdatedMatch = propertiesBlock.match(/"timeupdated"\s*"([^"]+)"/);
        const descriptionMatch = propertiesBlock.match(/"description"\s*"([^"]+)"/);
        const pwdrequiredMatch = propertiesBlock.match(/"pwdrequired"\s*"([^"]+)"/);
        if (buildidMatch && timeupdatedMatch) {
            branches.push({
                name: branchName,
                buildid: buildidMatch[1],
                timeupdated: timeupdatedMatch[1],
                description: descriptionMatch ? descriptionMatch[1] : undefined,
                pwdrequired: pwdrequiredMatch ? pwdrequiredMatch[1] === '1' : false,
            });
        }
    }
    // Sort by timeupdated descending
    branches.sort((a, b) => parseInt(b.timeupdated) - parseInt(a.timeupdated));
    return branches;
};
exports.parseSteamCmdBranches = parseSteamCmdBranches;
