import { Request, Response } from 'express';
import { sendServerMessage } from '../services/rcon.service';

/**
 * Controller to broadcast a message to the PZ server via RCON.
 */
export const broadcastMessage = async (req: Request, res: Response) => {
  const { message, instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({ error: 'Instance ID is required' });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = await sendServerMessage(instanceId, message);
    res.json({ message: 'Broadcast sent', result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send broadcast', details: (err as Error).message });
  }
};
