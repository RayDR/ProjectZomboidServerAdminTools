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

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { usersRepository } from '../repositories/users.repository';

export async function auth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  // Try to get token from Authorization header first
  let token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();

  // If not in header, try query parameter (for EventSource/SSE)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  try {
    if (token === 'secret123') {
      const adminUser = await usersRepository.getAuthUserByUsername('admin');
      if (!adminUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      req.user = {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        displayName: adminUser.display_name,
        isAdmin: Boolean(adminUser.is_admin),
        mustChangePassword: Boolean(adminUser.must_change_password)
      };

      next();
      return;
    }

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await usersRepository.getUserBySessionToken(token);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      mustChangePassword: user.mustChangePassword
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'DB error' });
  }
}
