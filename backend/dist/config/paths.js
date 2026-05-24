"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_INSTANCES_CONFIG_PATH = exports.SYSTEMD_TEMPLATE_PREFIX = exports.SYSTEMD_UNIT_PREFIX = exports.STEAMCMD_PATH = exports.PZ_INSTANCES_ROOT = exports.PZWEBADMIN_ROOT = void 0;
const path_1 = __importDefault(require("path"));
const isWindows = process.platform === 'win32';
const defaultWorkspaceRoot = path_1.default.resolve(__dirname, '../../..');
const defaultInstancesRoot = isWindows ? path_1.default.parse(process.cwd()).root : '/opt';
const defaultSteamcmdPath = isWindows ? 'C:/steamcmd/steamcmd.exe' : '/steamcmd/steamcmd.sh';
exports.PZWEBADMIN_ROOT = process.env.PZWEBADMIN_ROOT || defaultWorkspaceRoot;
exports.PZ_INSTANCES_ROOT = process.env.PZ_INSTANCES_ROOT || defaultInstancesRoot;
exports.STEAMCMD_PATH = process.env.PZ_STEAMCMD_PATH || defaultSteamcmdPath;
exports.SYSTEMD_UNIT_PREFIX = 'pzomboid-';
exports.SYSTEMD_TEMPLATE_PREFIX = 'pzomboid@';
exports.DEFAULT_INSTANCES_CONFIG_PATH = path_1.default.join(exports.PZWEBADMIN_ROOT, 'backend/src/config/instances.json');
