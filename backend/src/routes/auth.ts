import { Router } from 'express';
import { auth } from '../middleware/auth';
import { loginUser } from '../controllers/auth.controller';

/**
 * Async handler wrapper to standardize Express async error handling.
 */
const asyncHandler =
  (fn: (...args: any[]) => Promise<any>) =>
  (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

/**
 * POST /api/login
 * Public route to log in and receive a token.
 */
router.post('/login', asyncHandler(loginUser));

/**
 * GET /api/profile
 * Protected route to test authentication.
 */
router.get('/profile', auth, asyncHandler(async (req, res) => {
  // Solo un ejemplo. Si usas req.user, deberías definir un tipo personalizado.
  res.json({ message: 'Authenticated', user: req.user });
}));

export default router;
