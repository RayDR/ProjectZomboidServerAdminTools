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

/**
 * Login controller: validates password and returns a static token.
 */
export const loginUser = async (req: Request, res: Response) => {
  const { password } = req.body;

  if (password === 'admin123') {
    return res.json({ token: 'secret123' });
  }

  return res.status(401).json({ error: 'Unauthorized' });
};
