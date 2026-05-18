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
import { readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import { instanceManager } from '../managers/instance.manager';

const ALLOWED_TYPES = ['ini', 'sandbox', 'spawnpoints', 'spawnregions'];

/**
 * Helper to determine file path based on type
 */
const getFilePath = (baseIniPath: string, type: string): string => {
  const dir = path.dirname(baseIniPath);
  const ext = path.extname(baseIniPath); // .ini
  const basename = path.basename(baseIniPath, ext); // pzserver

  switch (type) {
    case 'sandbox':
      return path.join(dir, `${basename}_SandboxVars.lua`);
    case 'spawnpoints':
      return path.join(dir, `${basename}_spawnpoints.lua`);
    case 'spawnregions':
      return path.join(dir, `${basename}_spawnregions.lua`);
    case 'ini':
    default:
      return baseIniPath;
  }
};

/**
 * GET /api/config/ini
 * Reads the Project Zomboid INI configuration file or Lua configs.
 */
export const getIni = async (req: Request, res: Response) => {
  try {
    const { instanceId, type } = req.query;

    if (!instanceId) {
      res.status(400).json({ success: false, error: 'Instance ID required' });
      return;
    }

    const instance = await instanceManager.getInstance(String(instanceId));
    if (!instance) {
      res.status(404).json({ success: false, error: 'Instance not found' });
      return;
    }

    const configType = ALLOWED_TYPES.includes(String(type)) ? String(type) : 'ini';
    const filePath = getFilePath(instance.iniPath, configType);

    console.log(`Reading Config file at: ${filePath}`);
    const content = await readFile(filePath, 'utf-8');
    res.json({
      success: true,
      data: { content, path: filePath, type: configType }
    });
  } catch (err) {
    const error = err as Error;
    // If file doesn't exist, return empty or specific error? 
    // Usually these files should exist if server is initialized.
    res.status(500).json({
      success: false,
      error: 'Failed to read config file',
      details: error.message,
    });
  }
};

/**
 * PUT /api/config/ini
 * Updates the Project Zomboid INI or Lua file with new content.
 */
export const updateIni = async (req: Request, res: Response) => {
  try {
    const { content, instanceId, type } = req.body;

    if (!instanceId) {
      res.status(400).json({ success: false, error: 'Instance ID required' });
      return;
    }

    if (typeof content !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Invalid content format'
      });
      return;
    }

    const instance = await instanceManager.getInstance(String(instanceId));
    if (!instance) {
      res.status(404).json({ success: false, error: 'Instance not found' });
      return;
    }

    const configType = ALLOWED_TYPES.includes(String(type)) ? String(type) : 'ini';
    const filePath = getFilePath(instance.iniPath, configType);

    await writeFile(filePath, content);
    res.json({
      success: true,
      message: `${configType.toUpperCase()} file updated successfully`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update config file',
      details: (err as Error).message,
    });
  }
};
