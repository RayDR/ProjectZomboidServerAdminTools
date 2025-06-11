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
