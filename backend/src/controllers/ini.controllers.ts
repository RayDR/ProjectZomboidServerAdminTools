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
import { getInstanceById } from '../services/instances.service';

/**
 * GET /api/config/ini
 * Reads the Project Zomboid INI configuration file.
 */
export const getIni = async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.query;

    if (!instanceId) {
      res.status(400).json({ success: false, error: 'Instance ID required' });
      return;
    }

    const instance = await getInstanceById(String(instanceId));
    if (!instance) {
      res.status(404).json({ success: false, error: 'Instance not found' });
      return;
    }

    const iniPath = instance.iniPath;

    console.log(`Reading INI file at: ${iniPath}`);
    const content = await readFile(iniPath, 'utf-8');
    res.json({
      success: true,
      data: { content, path: iniPath }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to read INI file',
      details: (err as Error).message,
    });
  }
};

/**
 * PUT /api/config/ini
 * Updates the Project Zomboid INI file with new content.
 */
export const updateIni = async (req: Request, res: Response) => {
  try {
    const { content, instanceId } = req.body;

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

    const instance = await getInstanceById(String(instanceId));
    if (!instance) {
      res.status(404).json({ success: false, error: 'Instance not found' });
      return;
    }

    const iniPath = instance.iniPath;
    await writeFile(iniPath, content);
    res.json({
      success: true,
      message: 'INI file updated successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update INI file',
      details: (err as Error).message,
    });
  }
};
