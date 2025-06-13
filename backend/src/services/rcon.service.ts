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


import Rcon from 'rcon';
import { config } from '../config/env';

/**
 * Executes a remote RCON command and returns its raw response.
 */
export const runRconCommand = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const rcon = new Rcon(config.pzRconHost, config.pzRconPort, config.pzRconPassword, {
      tcp: true,
      challenge: false,
      timeout: 3000,
    });

    rcon.on('auth', () => {
      rcon.send(command);
    });

    rcon.on('response', (response) => {
      rcon.disconnect();
      resolve(response.trim());
    });

    rcon.on('error', (err) => {
      rcon.disconnect();
      reject(new Error(`RCON error: ${err.message}`));
    });

    rcon.connect();
  });
};

/**
 * Sends a broadcast message to the Project Zomboid server.
 */
export const sendServerMessage = (message: string): Promise<string> => {
  return runRconCommand(`servermsg "${message}"`);
};