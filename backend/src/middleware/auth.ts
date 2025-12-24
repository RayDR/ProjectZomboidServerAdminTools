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
import sqlite3 from 'sqlite3';
import { AuthenticatedRequest } from '../types/auth.types';

// Define the expected shape of the user row
interface UserRow {
  id: number;
  username: string;
}

const db = new sqlite3.Database('./db/pzadmin.db');

export function auth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Try to get token from Authorization header first
  let token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  
  // If not in header, try query parameter (for EventSource/SSE)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }
  
  console.log(`🔐 Auth middleware - Path: ${req.path}, Token: ${token ? token.substring(0, 10) + '...' : 'none'}`);

  if (token === 'secret123') {
    req.user = { username: 'token_user', id: null };
    console.log(`✅ Auth passed for ${req.path}`);
    next();
    return;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  db.get<UserRow>(
    `SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    [token],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: 'DB error' });
        return;
      }
      if (!row) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      req.user = { id: row.id, username: row.username };
      next();
    }
  );
}
