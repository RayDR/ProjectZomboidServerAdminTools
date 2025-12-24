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
import { readLogFile, clearLogWithBackup, getLogStats } from '../services/logs.service';

const router = Router();


// GET /api/logs/server - Get server log
router.get('/server', auth, async (req, res) => {
  const { lines = 500, instanceId } = req.query;

  if (!instanceId) {
    res.status(400).json({ success: false, error: 'Instance ID is required' });
    return;
  }

  try {
    const content = await readLogFile(String(instanceId), 'main', Number(lines));
    res.json({
      success: true,
      data: {
        content,
        type: 'server',
        lines: content.split('\n').length
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to read server log',
      details: (err as Error).message
    });
  }
});

// GET /api/logs/maintenance - Get maintenance log
router.get('/maintenance', auth, async (req, res) => {
  const { lines = 500, instanceId } = req.query;

  if (!instanceId) {
    res.status(400).json({ success: false, error: 'Instance ID is required' });
    return;
  }

  try {
    const content = await readLogFile(String(instanceId), 'maintenance', Number(lines));
    res.json({
      success: true,
      data: {
        content,
        type: 'maintenance',
        lines: content.split('\n').length
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to read maintenance log',
      details: (err as Error).message
    });
  }
});

// Legacy endpoint for backwards compatibility (Updated to require instanceId)
router.get('/', auth, async (req, res) => {
  const allowedTypes = ['main', 'maintenance', 'errors'] as const;
  const { type = 'main', lines = 100, instanceId } = req.query;

  if (!instanceId) {
    res.status(400).json({ success: false, error: 'Instance ID is required' });
    return;
  }

  const logType = allowedTypes.includes(type as any)
    ? (type as typeof allowedTypes[number])
    : 'main';

  try {
    const log = await readLogFile(String(instanceId), logType, Number(lines));
    res.json({ log });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to read log file',
      details: (err as Error).message
    });
  }
});

// POST /api/logs/clear - Clear log file with backup
router.post('/clear', auth, async (req, res) => {
  const { type = 'main', instanceId } = req.body;

  if (!instanceId) {
    res.status(400).json({ success: false, error: 'Instance ID is required' });
    return;
  }

  if (!['main', 'maintenance'].includes(type)) {
    res.status(400).json({
      success: false,
      error: 'Invalid log type. Must be "main" or "maintenance"'
    });
    return;
  }

  try {
    const result = await clearLogWithBackup(instanceId, type as 'main' | 'maintenance');
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear log',
      details: (err as Error).message
    });
  }
});

// GET /api/logs/stats - Get log statistics
router.get('/stats', auth, async (req, res) => {
  const { type = 'main', instanceId } = req.query;

  if (!instanceId) {
    res.status(400).json({ success: false, error: 'Instance ID is required' });
    return;
  }

  if (!['main', 'maintenance'].includes(type as string)) {
    res.status(400).json({
      success: false,
      error: 'Invalid log type'
    });
    return;
  }

  try {
    const stats = await getLogStats(String(instanceId), type as 'main' | 'maintenance');
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to get log stats',
      details: (err as Error).message
    });
  }
});

export default router;

