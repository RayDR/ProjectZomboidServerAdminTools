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
