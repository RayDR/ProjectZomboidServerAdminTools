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
import { runCommand } from '../services/commands.service';

/**
 * Controller to execute a shell command based on the requested action.
 * Supported actions: restart, stop, start, update, backup, status.
 */
export const executeCommand = async (req: Request, res: Response) => {
  const { action } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  try {
    const output = await runCommand(action);
    res.json({ message: `Action '${action}' executed successfully.`, output });
  } catch (err) {
    res.status(500).json({
      error: `Failed to execute action '${action}'`,
      details: err instanceof Error ? err.message : err,
    });
  }
};
