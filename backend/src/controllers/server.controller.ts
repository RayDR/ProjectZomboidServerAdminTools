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

import { Request, Response } from 'express';
import * as serverService from '../services/server.service';

/**
 * Start the server
 */
export const startServerController = async (_req: Request, res: Response) => {
  try {
    const result = await serverService.startServer();
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start server' 
    });
  }
};

/**
 * Stop the server
 */
export const stopServerController = async (_req: Request, res: Response) => {
  try {
    const result = await serverService.stopServer();
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to stop server' 
    });
  }
};

/**
 * Restart the server
 */
export const restartServerController = async (_req: Request, res: Response) => {
  try {
    const result = await serverService.restartServer();
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to restart server' 
    });
  }
};

/**
 * Get server status
 */
export const getServerStatusController = async (_req: Request, res: Response) => {
  try {
    const status = await serverService.getServerStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get server status' 
    });
  }
};

/**
 * Update the server
 */
export const updateServerController = async (_req: Request, res: Response) => {
  try {
    const result = await serverService.updateServer();
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update server' 
    });
  }
};

/**
 * Create a backup
 */
export const createBackupController = async (_req: Request, res: Response) => {
  try {
    const backup = await serverService.createBackup();
    res.json({ success: true, data: backup });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create backup' 
    });
  }
};

/**
 * List all backups
 */
export const listBackupsController = async (_req: Request, res: Response) => {
  try {
    const backups = await serverService.listBackups();
    res.json({ success: true, data: backups });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list backups' 
    });
  }
};

/**
 * Delete a backup
 */
export const deleteBackupController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      res.status(400).json({ 
        success: false, 
        error: 'Filename is required' 
      });
      return;
    }
    
    const result = await serverService.deleteBackup(filename);
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete backup' 
    });
  }
};
