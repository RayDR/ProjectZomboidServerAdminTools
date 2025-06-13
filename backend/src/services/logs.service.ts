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
 * Read the last N lines from either the main or maintenance log.
 * @param type 'main' or 'maintenance'
 * @param lines number of lines to read
 */
export const readLogFile = (
  type: 'main' | 'maintenance' | 'errors',
  lines: number
): Promise<string> => {
  let logPath = config.pzLogPath;

  if (type === 'maintenance') {
    logPath = config.pzMaintenanceLogPath;
  }

  const baseCommand = `tail -n ${lines} ${logPath}`;

  // If it's an error log, filter with grep
  const command = type === 'errors'
    ? `${baseCommand} | grep -i error`
    : baseCommand;

  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err && !stdout) return reject(stderr || err.message);
      resolve(stdout || '[No matching lines found]');
    });
  });
};

