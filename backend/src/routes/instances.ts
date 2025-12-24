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

const router = Router();

/**
 * @route GET /api/instances
 * @desc Get all server instances with their status
 * @access Private
 */
router.get('/', auth, instancesController.getInstancesController);

/**
 * @route POST /api/instances
 * @desc Add a new instance
 * @access Private
 */
router.post('/', auth, instancesController.addInstanceController);

/**
 * @route POST /api/instances/:instanceId/start
 * @desc Start an instance
 * @access Private
 */
router.post('/:instanceId/start', auth, instancesController.startInstanceController);

/**
 * @route POST /api/instances/:instanceId/stop
 * @desc Stop an instance
 * @access Private
 */
router.post('/:instanceId/stop', auth, instancesController.stopInstanceController);

/**
 * @route POST /api/instances/:instanceId/restart
 * @desc Restart an instance
 * @access Private
 */
router.post('/:instanceId/restart', auth, instancesController.restartInstanceController);

/**
 * @route POST /api/instances/:instanceId/kill
 * @desc Force stop an instance
 * @access Private
 */
router.post('/:instanceId/kill', auth, instancesController.forceStopInstanceController);

/**
 * @route PATCH /api/instances/:instanceId
 * @desc Update instance configuration
 * @access Private
 */
router.patch('/:instanceId', auth, instancesController.updateInstanceController);

export default router;
