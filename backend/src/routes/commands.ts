import { Router } from 'express';
import { executeCommand } from '../controllers/commands.controller';
import { auth } from '../middleware/auth';

/**
 * Async handler wrapper to standardize Express async error handling.
 */
const asyncHandler =
  (fn: (...args: any[]) => Promise<any>) =>
  (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

/**
 * POST /api/commands
 * Protected route to run server-side commands.
 */
router.post('/', auth, asyncHandler(executeCommand));

export default router;
