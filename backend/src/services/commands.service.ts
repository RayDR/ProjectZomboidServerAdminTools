/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

import { exec } from 'child_process';
import { config } from '../config/env';

/**
 * Run a specific shell command based on the action name.
 */
export const runCommand = (action: string): Promise<string> => {
  const commands: Record<string, string> = {
    restart: `sudo systemctl restart ${config.pzService}`,
    status: `sudo systemctl status ${config.pzService}`,
    start: `sudo systemctl start ${config.pzService}`,
    stop: `sudo systemctl stop ${config.pzService}`,
    update: `${config.pzSteamcmdPath} +login anonymous +force_install_dir ${config.pzDir} +app_update 380870 validate +quit`,
    backup: `sudo /opt/pzserver/scripts/backup.sh`,
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
