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
import { runRconCommand } from '../services/rcon.service';

/**
 * Handles the `/api/players` endpoint.
 * Returns a list of currently connected players via RCON.
 */
export const getConnectedPlayers = async (req: Request, res: Response) => {
  const { instanceId } = req.query;

  if (!instanceId) {
    res.status(400).json({ error: 'Instance ID is required' });
    return;
  }

  try {
    const raw = await runRconCommand(String(instanceId), 'players');
    const players = parsePlayers(raw);
    res.json({ players });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to retrieve player list.',
      details: (err as Error).message,
    });
  }
};

/**
 * Parses the raw RCON response to extract player names.
 */
const parsePlayers = (raw: string): string[] => {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('There are no'));
};
