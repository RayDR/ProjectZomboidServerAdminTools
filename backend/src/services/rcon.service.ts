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
import * as fs from 'fs/promises';
import { config } from '../config/env';
import { getInstanceById, ServerInstance } from './instances.service';

/**
 * Helper: Extract RCON password from INI file
 */
async function getRconPassword(instance: ServerInstance): Promise<string> {
  try {
    const iniContent = await fs.readFile(instance.iniPath, 'utf-8');
    const match = iniContent.match(/RCONPassword=(.*)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return config.pzRconPassword; // Fallback
  } catch (error) {
    console.warn(`[RCON] Failed to read INI for password, using default: ${error}`);
    return config.pzRconPassword;
  }
}

/**
 * Sends a broadcast message using mcrcon.
 */
export async function sendServerMessage(instanceId: string, message: string): Promise<void> {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error(`Instance ${instanceId} not found`);

  const password = await getRconPassword(instance);
  const escaped = message.replace(/"/g, '\\"');
  // Assuming mcrcon is installed and we use it for quick broadcasts
  const cmd = `/usr/local/bin/mcrcon -H ${config.pzRconHost} -P ${instance.rconPort} -p "${password}" "servermsg \\"${escaped}\\""`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`[RCON] ❌ Failed to send message to ${instance.name}:`, error.message);
    } else {
      console.log(`[RCON] ✅ Message sent to ${instance.name}:`, stdout.trim());
    }
  });
}

/**
 * Run a raw RCON command using Rcon module (TCP).
 */
export const runRconCommand = async (instanceId: string, command: string): Promise<string> => {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error(`Instance ${instanceId} not found`);

  const password = await getRconPassword(instance);

  return new Promise((resolve, reject) => {
    const Rcon = require('rcon');
    const rcon = new Rcon(config.pzRconHost, instance.rconPort, password, {
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
      // Sometimes connection refuses if server is down
      reject(new Error(`[RCON] Error: ${err.message}`));
    });
    rcon.on('end', () => {
      // Handle disconnect if no response?
    });

    rcon.connect();
  });
};

