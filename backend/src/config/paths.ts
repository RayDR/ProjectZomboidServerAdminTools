import path from 'path';

const isWindows = process.platform === 'win32';

const defaultWorkspaceRoot = path.resolve(__dirname, '../../..');
const defaultInstancesRoot = isWindows ? path.parse(process.cwd()).root : '/opt';
const defaultSteamcmdPath = isWindows ? 'C:/steamcmd/steamcmd.exe' : '/steamcmd/steamcmd.sh';

export const PZWEBADMIN_ROOT = process.env.PZWEBADMIN_ROOT || defaultWorkspaceRoot;
export const PZ_INSTANCES_ROOT = process.env.PZ_INSTANCES_ROOT || defaultInstancesRoot;
export const STEAMCMD_PATH = process.env.PZ_STEAMCMD_PATH || defaultSteamcmdPath;
export const SYSTEMD_UNIT_PREFIX = 'pzomboid-';
export const SYSTEMD_TEMPLATE_PREFIX = 'pzomboid@';

export const DEFAULT_INSTANCES_CONFIG_PATH = path.join(PZWEBADMIN_ROOT, 'backend/src/config/instances.json');
