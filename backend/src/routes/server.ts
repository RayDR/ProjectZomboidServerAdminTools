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
import * as serverController from '../controllers/server.controller';
import * as serverLogsController from '../controllers/server-logs.controller';
import * as configService from '../services/config.service';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * Server Control Routes
 * All routes are protected with authentication middleware
 */

// POST /api/server/start - Start the server
router.post('/start', auth, serverController.startServerController);

// POST /api/server/stop - Stop the server
router.post('/stop', auth, serverController.stopServerController);

// POST /api/server/restart - Restart the server
router.post('/restart', auth, serverController.restartServerController);

// GET /api/server/status - Get server status
router.get('/status', auth, serverController.getServerStatusController);

// POST /api/server/update - Update the server
router.post('/update', auth, serverController.updateServerController);

// Server operation logs streaming (SSE)
router.get('/logs/stream/:operation', auth, serverLogsController.streamServerLogs);
router.get('/logs/stream-backup', auth, serverLogsController.streamBackupLogs);
router.get('/logs/stream-update', auth, serverLogsController.streamUpdateLogs);

// Backup routes
// POST /api/server/backup - Create a new backup
router.post('/backup', auth, serverController.createBackupController);

// GET /api/server/backups - List all backups
router.get('/backups', auth, serverController.listBackupsController);

// DELETE /api/server/backups/:filename - Delete a backup
router.delete('/backups/:filename', auth, serverController.deleteBackupController);

// GET /api/server/config - Get server configuration
router.get('/config', auth, async (req, res) => {
  const result = await configService.getServerConfig();
  res.json(result);
});

export default router;
