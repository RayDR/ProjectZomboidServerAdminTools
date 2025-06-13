import { Router } from 'express';
import { auth } from '../middleware/auth';
import { broadcastMessage } from '../controllers/messages.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * POST /api/messages
 * Authenticated route to send a server message via RCON.
 */
router.post('/', auth, asyncHandler(broadcastMessage));

export default router;
