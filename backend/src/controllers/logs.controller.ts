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

import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { readLogFile } from '../services/logs.service';

export const getLog = async (req: AuthenticatedRequest, res: Response) => {
  const { type = 'main', lines = 100 } = req.query;
  const logType = type === 'maintenance' ? 'maintenance' : 'main';

  try {
    const data = await readLogFile(logType, Number(lines));
    res.json({ log: data });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to read log file',
      details: error instanceof Error ? error.message : error,
    });
  }
};
