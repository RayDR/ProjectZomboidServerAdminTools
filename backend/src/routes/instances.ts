
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
import * as instancesController from '../controllers/instances.controller';
import { auth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();
const upload = multer({ dest: path.join(__dirname, '../../uploads') });

// Crear instancia desde versión seleccionada
router.post('/from-version', auth, (req, res) => { void instancesController.createInstanceFromVersionController(req, res); });
// List available PZ server versions
router.get('/versions', auth, (req, res) => { void instancesController.getAvailableVersionsController(req, res); });

// Instances management
router.get('/', auth, (req, res) => { void instancesController.getInstancesController(req, res); });
router.post('/', auth, (req, res) => { void instancesController.addInstanceController(req, res); });
router.post('/:instanceId/start', auth, (req, res) => { void instancesController.startInstanceController(req, res); });
router.post('/:instanceId/stop', auth, (req, res) => { void instancesController.stopInstanceController(req, res); });
router.post('/:instanceId/restart', auth, (req, res) => { void instancesController.restartInstanceController(req, res); });
router.post('/:instanceId/kill', auth, (req, res) => { void instancesController.forceStopInstanceController(req, res); });
router.patch('/:instanceId', auth, (req, res) => { void instancesController.updateInstanceController(req, res); });
router.delete('/:instanceId', auth, (req, res) => { void instancesController.deleteInstanceController(req, res); });

// Mods Management
router.get('/:instanceId/mods', auth, (req, res) => { void instancesController.getModsController(req, res); });
router.post('/:instanceId/mods', auth, (req, res) => { void instancesController.addModController(req, res); });
router.post('/:instanceId/mods/upload', auth, upload.single('file'), (req, res) => { void instancesController.uploadModController(req, res); });
router.delete('/:instanceId/mods/:modId', auth, (req, res) => { void instancesController.removeModController(req, res); });

export default router;

