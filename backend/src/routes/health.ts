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
import { config } from '../config/env';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();
const startTime = Date.now();
const version = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8')).version;

router.get('/', (_req, res) => {
  const uptimeMs = Date.now() - startTime;

  res.json({
    app: 'PZWebAdmin-API',
    status: '✅ Online',
    version,
    server: config.pzName || 'pzserver',
    poweredBy: 'DomoForge (domoforge.com)',
    environment: process.env.NODE_ENV || 'development',
    startedAt: new Date(startTime).toISOString(),
    uptime: `${Math.floor(uptimeMs / 1000)}s`,
    timestamp: new Date().toISOString(),
    message: '🧠 Everything is operational. Keep surviving!',
  });
});

export default router;
