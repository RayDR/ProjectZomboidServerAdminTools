/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 */

import { Request, Response } from 'express';
import { spawn } from 'child_process';
import { config } from '../config/env';

/**
 * Stream server operation logs using Server-Sent Events
 * GET /api/server/logs/stream/:operation
 */
export const streamServerLogs = (req: Request, res: Response) => {
  const { operation } = req.params;
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendLog = (data: string) => {
    res.write(`data: ${JSON.stringify({ log: data, timestamp: new Date().toISOString() })}\n\n`);
  };

  const sendError = (error: string) => {
    res.write(`data: ${JSON.stringify({ error, timestamp: new Date().toISOString() })}\n\n`);
  };

  const sendComplete = (success: boolean, message: string) => {
    res.write(`data: ${JSON.stringify({ complete: true, success, message, timestamp: new Date().toISOString() })}\n\n`);
    res.end();
  };

  try {
    let command: string;
    let args: string[];

    switch (operation) {
      case 'start':
        sendLog('🚀 Starting Project Zomboid server...');
        command = 'sudo';
        args = ['systemctl', 'start', config.pzService];
        break;
      
      case 'stop':
        sendLog('🛑 Stopping Project Zomboid server...');
        command = 'sudo';
        args = ['systemctl', 'stop', config.pzService];
        break;
      
      case 'restart':
        sendLog('🔄 Restarting Project Zomboid server...');
        command = 'sudo';
        args = ['systemctl', 'restart', config.pzService];
        break;
      
      default:
        sendError(`Unknown operation: ${operation}`);
        sendComplete(false, 'Invalid operation');
        return;
    }

    // Execute the command
    const process = spawn(command, args);

    process.stdout.on('data', (data) => {
      sendLog(data.toString());
    });

    process.stderr.on('data', (data) => {
      sendLog(data.toString());
    });

    process.on('close', async (code) => {
      if (code === 0) {
        sendLog(`✅ Command executed successfully (exit code: ${code})`);
        
        // Wait a bit for the service to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get journal logs to show what happened
        sendLog('📋 Fetching service logs...');
        const journal = spawn('sudo', ['journalctl', '-u', config.pzService, '-n', '20', '--no-pager']);
        
        journal.stdout.on('data', (data) => {
          sendLog(data.toString());
        });

        journal.on('close', () => {
          sendComplete(true, `Server ${operation} completed successfully`);
        });
      } else {
        sendError(`Command failed with exit code: ${code}`);
        sendComplete(false, `Server ${operation} failed`);
      }
    });

    process.on('error', (error) => {
      sendError(`Process error: ${error.message}`);
      sendComplete(false, error.message);
    });

    // Handle client disconnect
    req.on('close', () => {
      process.kill();
    });

  } catch (error) {
    sendError(`Exception: ${error instanceof Error ? error.message : error}`);
    sendComplete(false, 'Operation failed');
  }
};

/**
 * Stream backup operation logs
 * GET /api/server/logs/stream/backup
 */
export const streamBackupLogs = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendLog = (data: string) => {
    res.write(`data: ${JSON.stringify({ log: data, timestamp: new Date().toISOString() })}\n\n`);
  };

  const sendComplete = (success: boolean, message: string) => {
    res.write(`data: ${JSON.stringify({ complete: true, success, message, timestamp: new Date().toISOString() })}\n\n`);
    res.end();
  };

  sendLog('💾 Starting backup process...');
  
  // Import backup function dynamically
  import('../services/server.service').then(({ createBackup }) => {
    createBackup()
      .then((result: { filename: string; path: string; size: number; timestamp: string }) => {
        sendLog(`✅ Backup created: ${result.filename}`);
        sendLog(`📁 Path: ${result.path}`);
        sendLog(`📦 Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
        sendComplete(true, `Backup created successfully: ${result.filename}`);
      })
      .catch((error: Error) => {
        sendLog(`❌ Backup failed: ${error.message}`);
        sendComplete(false, error.message);
      });
  });
};

/**
 * Stream update operation logs
 * GET /api/server/logs/stream/update
 */
export const streamUpdateLogs = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendLog = (data: string) => {
    res.write(`data: ${JSON.stringify({ log: data, timestamp: new Date().toISOString() })}\n\n`);
  };

  const sendComplete = (success: boolean, message: string) => {
    res.write(`data: ${JSON.stringify({ complete: true, success, message, timestamp: new Date().toISOString() })}\n\n`);
    res.end();
  };

  sendLog('📥 Starting SteamCMD update...');
  sendLog(`Command: ${config.pzSteamcmdPath} +login anonymous +force_install_dir ${config.pzDir} +app_update 380870 validate +quit`);
  
  const process = spawn(config.pzSteamcmdPath, [
    '+login', 'anonymous',
    '+force_install_dir', config.pzDir,
    '+app_update', '380870', 'validate',
    '+quit'
  ]);

  process.stdout.on('data', (data) => {
    sendLog(data.toString());
  });

  process.stderr.on('data', (data) => {
    sendLog(data.toString());
  });

  process.on('close', (code) => {
    if (code === 0) {
      sendLog('✅ Update completed successfully');
      sendComplete(true, 'Server updated successfully');
    } else {
      sendLog(`❌ Update failed with exit code: ${code}`);
      sendComplete(false, 'Update failed');
    }
  });

  req.on('close', () => {
    process.kill();
  });
};
