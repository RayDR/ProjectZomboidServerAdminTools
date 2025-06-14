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

import { Router } from 'express';
import { auth } from '../middleware/auth';
import { readLogFile } from '../services/logs.service';

const router = Router();

router.get('/', auth, async (req, res) => {
  const allowedTypes = ['main', 'maintenance', 'errors'] as const;
  const { type = 'main', lines = 100 } = req.query;

  const logType = allowedTypes.includes(type as any)
    ? (type as typeof allowedTypes[number])
    : 'main';

  try {
    const log = await readLogFile(logType, Number(lines));
    res.json({ log });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to read log file',
      details: (err as Error).message
    });
  }
});

export default router;

