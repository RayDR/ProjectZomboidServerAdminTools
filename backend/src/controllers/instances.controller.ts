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
import * as instancesService from '../services/instances.service';

/**
 * Get all server instances
 */
export const getInstancesController = async (_req: Request, res: Response) => {
  try {
    const instances = await instancesService.getInstancesStatus();
    res.json({ success: true, data: instances });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get instances'
    });
  }
};

/**
 * Start an instance
 */
export const startInstanceController = async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const message = await instancesService.startInstance(instanceId);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start instance'
    });
  }
};

/**
 * Stop an instance
 */
export const stopInstanceController = async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const message = await instancesService.stopInstance(instanceId);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop instance'
    });
  }
};

/**
 * Restart an instance
 */
export const restartInstanceController = async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const message = await instancesService.restartInstance(instanceId);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restart instance'
    });
  }
};

/**
 * Force Stop an instance
 */
export const forceStopInstanceController = async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const message = await instancesService.forceStopInstance(instanceId);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to force stop instance'
    });
  }
};

/**
 * Add a new instance
 */
export const addInstanceController = async (req: Request, res: Response) => {
  try {
    const { name, path, serviceName } = req.body;
    if (!name || !path || !serviceName) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    const instance = await instancesService.addInstance(name, path, serviceName);
    res.json({ success: true, data: instance });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add instance'
    });
  }
};


/**
 * Update instance configuration
 */
export const updateInstanceController = async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const updates = req.body;

    const instance = await instancesService.updateInstance(instanceId, updates);
    res.json({ success: true, data: instance });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update instance'
    });
  }
};
