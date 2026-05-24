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
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { usersRepository } from '../repositories/users.repository';

/**
 * Login controller: validates the admin password against the users table and creates a session token.
 */
export const loginUser = async (req: Request, res: Response) => {
  const { username = 'admin', password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const user = await usersRepository.getAuthUserByUsername(String(username || 'admin').trim() || 'admin');
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ok = await bcrypt.compare(String(password), user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = crypto.randomUUID();
  await usersRepository.createSession(user.id, token);

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      isAdmin: Boolean(user.is_admin),
      mustChangePassword: Boolean(user.must_change_password)
    }
  });
};
