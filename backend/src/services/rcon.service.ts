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
 * Sends a broadcast message using mcrcon.
 */
export function sendServerMessage(message: string): void {
  const escaped = message.replace(/"/g, '\\"');
  const cmd = `/usr/local/bin/mcrcon -H ${config.pzRconHost} -P ${config.pzRconPort} -p "${config.pzRconPassword}" "servermsg \\"${escaped}\\""`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('[RCON] ❌ Failed to send message:', error.message);
    } else {
      console.log('[RCON] ✅ Message sent:', stdout.trim());
    }
  });
}

/**
 * Optional fallback: Run a raw RCON command using Rcon module (TCP).
 */
export const runRconCommand = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const Rcon = require('rcon');
    const rcon = new Rcon(config.pzRconHost, config.pzRconPort, config.pzRconPassword, {
      tcp: true,
      challenge: false,
      timeout: 3000,
    });

    rcon.on('auth', () => rcon.send(command));
    rcon.on('response', (res: string) => {
      rcon.disconnect();
      resolve(res.trim());
    });
    rcon.on('error', (err: Error) => {
      rcon.disconnect();
      reject(new Error(`[RCON] Error: ${err.message}`));
    });

    rcon.connect();
  });
};
