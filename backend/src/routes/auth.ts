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
import { loginUser } from '../controllers/auth.controller';

/**
 * Async handler wrapper to standardize Express async error handling.
 */
const asyncHandler = (fn: (...args: any[]) => Promise<any>) => (req: any, res: any, next: any) =>
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
router.get(
  '/profile',
  auth,
  asyncHandler(async (req, res) => {
    res.json({ message: 'Authenticated', user: req.user });
  })
);

export default router;
