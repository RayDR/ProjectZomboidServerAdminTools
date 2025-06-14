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
import { getConnectedPlayers } from '../controllers/players.controller';

const router = Router();

/**
 * GET /api/players
 * Returns the list of connected players via RCON.
 */
router.get('/', auth, getConnectedPlayers);

export default router;
