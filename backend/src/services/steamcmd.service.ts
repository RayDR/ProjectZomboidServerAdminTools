/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import * as path from 'path';
import { PZWEBADMIN_ROOT, STEAMCMD_PATH } from '../config/paths';
import { AppError } from '../utils/errors';

const execFilePromise = promisify(execFile);

// Cache variables
let branchesCache: BranchCatalogResult | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface SteamBranch {
  name: string;
  buildid: string;
  timeupdated: string;
  description?: string;
  pwdrequired?: boolean;
}

export interface BranchOption {
  id: string;
  label: string;
  description: string;
  steamBranch: string;
  requiresPassword: boolean;
  default?: boolean;
  buildid?: string;
}

export interface BranchCatalogResult {
  source: 'steamcmd' | 'fallback' | 'mixed';
  data: BranchOption[];
}

interface SteamCmdCheck {
  path: string;
  exists: boolean;
  executable: boolean;
}

const FALLBACK_BRANCHES_PATH = path.join(PZWEBADMIN_ROOT, 'backend/config/zomboid-branches.json');
const DEFAULT_FALLBACK_BRANCHES: BranchOption[] = [
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
export const getAvailableBuilds = async (): Promise<BranchCatalogResult> => {
  // Check Cache
  if (branchesCache && (Date.now() - cacheTimestamp < CACHE_TTL_MS)) {
    return branchesCache;
  }

  const fallback = await loadFallbackBranches();

  try {
    const steamCmdInfo = await resolveSteamCmdPath();

    console.info(`[versions] steamcmdPath=${steamCmdInfo.path}`);
    console.info(`[versions] steamcmdExists=${steamCmdInfo.exists} steamcmdExecutable=${steamCmdInfo.executable}`);

    if (!steamCmdInfo.exists || !steamCmdInfo.executable) {
      if (!fallback.length) {
        throw new AppError('SteamCMD is not installed or not executable and fallback branch list is empty.', 'STEAMCMD_NOT_FOUND', 500);
      }

      console.warn('[versions] Using fallback branches because SteamCMD is unavailable.');
      const result: BranchCatalogResult = {
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

    const steamBranches = parseSteamCmdBranches(stdout);
    console.info(`[versions] steamcmdParsedBranches=${steamBranches.length}`);

    const steamOptions = mapSteamBranchesToOptions(steamBranches);
    const merged = mergeBranchOptions(steamOptions, fallback);

    if (!steamOptions.length && !fallback.length) {
      throw new AppError('SteamCMD did not return branches and fallback branch list is empty.', 'INSTALL_FAILED', 500);
    }

    const source: BranchCatalogResult['source'] =
      steamOptions.length > 0 && fallback.length > 0
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

    const result: BranchCatalogResult = { source, data: merged };

    // Update cache
    branchesCache = result;
    cacheTimestamp = Date.now();

    return result;
  } catch (error) {
    console.error('[versions] Failed to get available builds from SteamCMD:', error);
    if (!fallback.length) {
      throw error;
    }

    console.warn('[versions] Falling back to local branch list after SteamCMD error.');
    const result: BranchCatalogResult = {
      source: 'fallback',
      data: fallback
    };
    branchesCache = result;
    cacheTimestamp = Date.now();
    return result;
  }
};

// Loads fallback branches from local config/zomboid-branches.json
async function loadFallbackBranches(): Promise<BranchOption[]> {
  try {
    const data = await fs.readFile(FALLBACK_BRANCHES_PATH, 'utf-8');
    const parsed = JSON.parse(data) as Array<Partial<BranchOption>>;
    if (!Array.isArray(parsed)) {
      return DEFAULT_FALLBACK_BRANCHES;
    }

    const normalized = parsed
      .filter((entry): entry is Partial<BranchOption> & { id: string } => typeof entry.id === 'string' && entry.id.trim().length > 0)
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
  } catch (e) {
    console.error('[versions] Failed to load fallback branches from config/zomboid-branches.json:', e);
    return DEFAULT_FALLBACK_BRANCHES;
  }
}

const mapSteamBranchesToOptions = (branches: SteamBranch[]): BranchOption[] => {
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

const mergeBranchOptions = (steamOptions: BranchOption[], fallbackOptions: BranchOption[]): BranchOption[] => {
  if (!steamOptions.length) {
    return fallbackOptions;
  }

  const byId = new Map<string, BranchOption>();

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

export const resolveBranchById = async (branchId: string, options?: { allowUnknown?: boolean }): Promise<BranchOption> => {
  const normalizedId = typeof branchId === 'string' ? branchId.trim() : '';
  if (!normalizedId) {
    throw new AppError('Branch ID is required.', 'INVALID_BRANCH', 400);
  }

  const catalog = await getAvailableBuilds();
  const resolved = catalog.data.find((branch) => branch.id === normalizedId);
  if (!resolved) {
    // Backward-compat alias resolution for legacy branch IDs that may have been renamed upstream.
    const legacyPatterns: Record<string, RegExp[]> = {
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
        throw new AppError(`Branch '${normalizedId}' has an invalid format.`, 'INVALID_BRANCH', 400);
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

    throw new AppError(`Branch '${normalizedId}' is not available.`, 'INVALID_BRANCH', 400);
  }

  return resolved;
};

export const resolveSteamCmdPath = async (): Promise<SteamCmdCheck> => {
  const configuredPath = process.env.PZ_STEAMCMD_PATH?.trim();
  const candidate = configuredPath && configuredPath.length > 0 ? configuredPath : STEAMCMD_PATH;

  let exists = false;
  let executable = false;

  try {
    await fs.access(candidate, fsConstants.F_OK);
    exists = true;
  } catch {
    exists = false;
  }

  if (exists) {
    try {
      await fs.access(candidate, fsConstants.X_OK);
      executable = true;
    } catch {
      executable = false;
    }
  }

  return {
    path: candidate,
    exists,
    executable
  };
};

/**
 * Parse SteamCMD app_info_print output to extract branches
 */
export const parseSteamCmdBranches = (output: string): SteamBranch[] => {
  const branches: SteamBranch[] = [];
  
  // Look for the branches block in VDF output
  const branchesBlockMatch = output.match(/"branches"\s*\{([\s\S]*?)\n\s*\}/);
  if (!branchesBlockMatch) return branches;

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
