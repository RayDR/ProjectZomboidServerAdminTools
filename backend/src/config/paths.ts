import path from 'path';

export const PZWEBADMIN_ROOT = '/opt/pzwebadmin';
export const PZ_INSTANCES_ROOT = '/opt';
export const STEAMCMD_PATH = '/steamcmd/steamcmd.sh';
export const SYSTEMD_UNIT_PREFIX = 'pzomboid-';
export const SYSTEMD_TEMPLATE_PREFIX = 'pzomboid@';

export const DEFAULT_INSTANCES_CONFIG_PATH = path.join(PZWEBADMIN_ROOT, 'backend/src/config/instances.json');
