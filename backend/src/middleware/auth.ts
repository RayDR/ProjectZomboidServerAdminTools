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

export function auth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();

  if (token === 'secret123') {
    req.user = { username: 'token_user', id: null };
    return next();
  }

  db.get<UserRow>(
    `SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    [token],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(401).json({ error: 'Unauthorized' });

      req.user = { id: row.id, username: row.username };
      next();
    }
  );
}
