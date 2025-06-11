import { exec } from 'child_process';
import { config } from '../config/env';

/**
 * Run a specific shell command based on the action name.
 */
export const runCommand = (action: string): Promise<string> => {
  const commands: Record<string, string> = {
    restart: `systemctl restart ${config.pzService}`,
    status: `systemctl status ${config.pzService}`,
    start: `systemctl start ${config.pzService}`,
    stop: `systemctl stop ${config.pzService}`,
    update: `${config.pzSteamcmdPath} +login anonymous +force_install_dir ${config.pzDir} +app_update 380870 validate +quit`,
    backup: `/opt/pzserver/scripts/backup.sh`,
  };

  const cmd = commands[action];
  if (!cmd) {
    return Promise.reject(new Error(`Unsupported action: ${action}`));
  }

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout.trim());
    });
  });
};
