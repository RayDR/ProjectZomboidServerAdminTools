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
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import readline from 'readline';
import { getInstanceById } from './instances.service';

const execPromise = promisify(exec);

/**
 * Read the last N lines from either the main or maintenance log.
 * @param type 'main' or 'maintenance'
 * @param lines number of lines to read
 */
export const readLogFile = async (
  instanceId: string,
  type: 'main' | 'maintenance' | 'errors',
  lines: number
): Promise<string> => {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error(`Instance ${instanceId} not found`);

  let logPath = instance.logPath;

  if (type === 'maintenance') {
    logPath = instance.maintenanceLogPath;
  }

  const baseCommand = `tail -n ${lines} ${logPath}`;

  // If it's an error log, filter with grep
  const command = type === 'errors'
    ? `${baseCommand} | grep -i error`
    : baseCommand;

  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      // If error is just "file not found" or empty, treat as empty
      if (err && !stdout) {
        // return reject(stderr || err.message);
        // Return empty if file not created yet
        return resolve('');
      }
      resolve(stdout || '[No matching lines found]');
    });
  });
};

/**
 * Parses the main server log and returns players that connected within the last hour.
 */
export const getRecentPlayersFromLog = async (instanceId: string): Promise<string[]> => {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error(`Instance ${instanceId} not found`);

  const logPath = instance.logPath;

  // Check if exist
  try {
    await fs.promises.access(logPath);
  } catch {
    return [];
  }

  const fileStream = fs.createReadStream(logPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  const players = new Set<string>();

  for await (const line of rl) {
    if (!line.includes('username="')) continue;

    // Parse timestamp: example [15-06-25 05:15:30.993]
    const match = line.match(/\[(\d{2})-(\d{2})-(\d{2}) (\d{2}:\d{2}:\d{2})\]/);
    let logTime = now;

    if (match) {
      const [_, mm, dd, yy, time] = match;
      const formatted = `20${yy}/${mm}/${dd} ${time}`;
      const parsed = Date.parse(formatted);
      if (!isNaN(parsed)) logTime = parsed;
    }

    if (now - logTime < oneHourMs) {
      const nameMatch = line.match(/username="([^"]+)"/);
      if (nameMatch) players.add(nameMatch[1]);
    }
  }

  return Array.from(players);
};

/**
 * Clear log file and create backup (only one backup per day)
 * @param type 'main' or 'maintenance'
 */
export const clearLogWithBackup = async (
  instanceId: string,
  type: 'main' | 'maintenance'
): Promise<{ success: boolean; message: string; backup?: string }> => {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error(`Instance ${instanceId} not found`);

  const logPath = type === 'main' ? instance.logPath : instance.maintenanceLogPath;
  const logDir = path.dirname(logPath);
  const logFileName = path.basename(logPath);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupFileName = `${logFileName}.backup-${today}`;
  const backupPath = path.join(logDir, backupFileName);

  try {
    // Check if log file exists and has content
    try {
      await fs.promises.access(logPath);
    } catch {
      return { success: false, message: 'Log file does not exist' };
    }
    const stats = await fs.promises.stat(logPath);

    if (stats.size === 0) {
      return {
        success: false,
        message: 'Log file is already empty, no backup created'
      };
    }

    // Check if backup for today already exists
    if (fs.existsSync(backupPath)) {
      // Check if existing backup has content
      const backupStats = await fs.promises.stat(backupPath);

      if (backupStats.size > 0) {
        return {
          success: false,
          message: `Backup already exists for today: ${backupFileName}. Only one backup per day is allowed.`
        };
      } else {
        // Existing backup is empty, we can overwrite it
        await fs.promises.unlink(backupPath);
      }
    }

    // Create backup
    await fs.promises.copyFile(logPath, backupPath);

    // Verify backup was created and has content
    const backupStats = await fs.promises.stat(backupPath);
    if (backupStats.size === 0) {
      await fs.promises.unlink(backupPath);
      return {
        success: false,
        message: 'Backup was empty and has been discarded'
      };
    }

    // Clear original log file
    await fs.promises.writeFile(logPath, '');

    return {
      success: true,
      message: `Log cleared successfully. Backup created: ${backupFileName}`,
      backup: backupFileName
    };

  } catch (error) {
    throw new Error(`Failed to clear log: ${error instanceof Error ? error.message : error}`);
  }
};

/**
 * Get log file size and line count
 */
export const getLogStats = async (
  instanceId: string,
  type: 'main' | 'maintenance'
): Promise<{
  totalLines: number;
  fileSize: number;
  fileSizeFormatted: string;
}> => {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error(`Instance ${instanceId} not found`);

  const logPath = type === 'main' ? instance.logPath : instance.maintenanceLogPath;

  try {
    const stats = await fs.promises.stat(logPath);
    const { stdout } = await execPromise(`wc -l < ${logPath}`);
    const totalLines = parseInt(stdout.trim()) || 0;

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    return {
      totalLines,
      fileSize: stats.size,
      fileSizeFormatted: formatFileSize(stats.size)
    };
  } catch (error) {
    // If error (e.g. file missing), return 0
    return {
      totalLines: 0,
      fileSize: 0,
      fileSizeFormatted: '0 B'
    };
  }
};