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
import multer from 'multer';
import * as modsController from '../controllers/mods.controller';
import { auth } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: '/tmp/pz-mod-uploads',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  }
});

/**
 * Mods Routes
 * All routes are protected with authentication middleware
 */

// GET /api/mods - Get installed mods
router.get('/', auth, modsController.getInstalledModsController);

// POST /api/mods/install - Install a mod (with file upload support)
router.post('/install', auth, upload.array('files', 10), modsController.installModController);

// DELETE /api/mods/:modId - Uninstall a mod
router.delete('/:modId', auth, modsController.uninstallModController);

// POST /api/mods/update-all - Update all mods (simple response)
router.post('/update-all', auth, modsController.updateAllModsController);

// GET /api/mods/update-all-stream - Update all mods with SSE streaming
router.get('/update-all-stream', auth, modsController.updateAllModsStreamController);

// GET /api/mods/validate - Validate mod files
router.get('/validate', auth, modsController.validateModsController);

export default router;
