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
import { join } from 'path';
import { config } from '../config/env';

/**
 * GET /api/ini
 * Reads the Project Zomboid INI configuration file.
 */
export const getIni = async (_req: Request, res: Response) => {
  try {
    const iniPath = join(config.pzIniPath, `${config.pzName}.ini`);
    const content = await readFile(iniPath, 'utf-8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to read INI file',
      details: (err as Error).message,
    });
  }
}

/**
 * PUT /api/ini
 * Updates the Project Zomboid INI file with new content.
 */
export const updateIni = async (req: Request, res: Response) => {
  try {
    const content = req.body.content;
    if (typeof content !== 'string') {
      res.status(400).json({ error: 'Invalid content format' });
      return;
    }

    const iniPath = join(config.pzIniPath, `${config.pzName}.ini`);
    await writeFile(iniPath, content);
    res.json({ message: 'INI file updated successfully' });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to update INI file',
      details: (err as Error).message,
    });
  }
};
