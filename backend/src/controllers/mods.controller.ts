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
import * as modsService from '../services/mods.service';

/**
 * Get installed mods
 */
export const getInstalledModsController = async (_req: Request, res: Response) => {
  try {
    const mods = await modsService.getInstalledMods();
    res.json({ success: true, data: mods });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get installed mods' 
    });
  }
};

/**
 * Install a mod
 */
export const installModController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workshopId, modId } = req.body;
    
    if (!workshopId || !modId) {
      res.status(400).json({ 
        success: false, 
        error: 'workshopId and modId are required' 
      });
      return;
    }
    
    const result = await modsService.installMod(workshopId, modId);
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to install mod' 
    });
  }
};

/**
 * Uninstall a mod
 */
export const uninstallModController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { modId } = req.params;
    
    if (!modId) {
      res.status(400).json({ 
        success: false, 
        error: 'modId is required' 
      });
      return;
    }
    
    const result = await modsService.uninstallMod(modId);
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to uninstall mod' 
    });
  }
};

/**
 * Update all mods
 */
export const updateAllModsController = async (_req: Request, res: Response) => {
  try {
    const result = await modsService.updateAllMods();
    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update mods' 
    });
  }
};

/**
 * Validate mods
 */
export const validateModsController = async (_req: Request, res: Response) => {
  try {
    const result = await modsService.validateMods();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to validate mods' 
    });
  }
};
