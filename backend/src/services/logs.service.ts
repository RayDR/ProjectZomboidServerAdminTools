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
import { instanceManager } from '../managers/instance.manager';

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
  const instance = await instanceManager.getInstance(instanceId);
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
  const instance = await instanceManager.getInstance(instanceId);
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
  const instance = await instanceManager.getInstance(instanceId);
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
        // Backup exists and is valid. We skip creating a NEW backup, but we MUST proceed to clear the log.
        // We will just return a message saying backup was skipped.
        /* logic continues to clearing below without error */
      } else {
        // Existing backup is empty, we can overwrite it
        await fs.promises.unlink(backupPath);
        // Create backup
        await fs.promises.copyFile(logPath, backupPath);
      }
    } else {
      // Create backup since it doesn't exist
      await fs.promises.copyFile(logPath, backupPath);
    }


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
  const instance = await instanceManager.getInstance(instanceId);
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

/**
 * Streaming logs via SSE (Server Sent Events)
 * Uses tail -f to stream new lines
 */
export const streamLog = (instanceId: string, res: any) => {
  // Use a promise to resolve instance first, but we can't block the stream setup easily in a sync way,
  // so we do it async and handle errors by sending an SSE error event.
  instanceManager.getInstance(instanceId).then(instance => {
    if (!instance) {
      res.write(`event: error\ndata: Instance not found\n\n`);
      res.end();
      return;
    }

    const logPath = instance.logPath; // Main log only for now

    // Spawn tail -f -n 0 (start from now, don't send history, history is fetched via REST)
    // Actually, let's send 0 lines of history to avoid dupes, frontend handles history.
    const tail = exec(`tail -f -n 0 ${logPath}`); // Not using -F to keep it simple, might break on rotation but we handle rotation manually

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send initial keep-alive
    res.write(`: connected\n\n`);

    tail.stdout?.on('data', (data) => {
      // Data can be multiple lines
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line) continue;
        res.write(`data: ${JSON.stringify({ line })}\n\n`);
      }
    });

    tail.stderr?.on('data', (data) => {
      // Ignored or logged to system
      console.error('Tail Error:', data);
    });

    // Cleanup
    res.on('close', () => {
      tail.kill();
    });

  }).catch(err => {
    res.write(`event: error\ndata: ${err.message}\n\n`);
    res.end();
  });
};