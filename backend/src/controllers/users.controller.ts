import { Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthenticatedRequest } from '../types/auth.types';
import { usersRepository } from '../repositories/users.repository';

const MIN_PASSWORD_LENGTH = 6;

const normalize = (value: unknown): string => String(value || '').trim();

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getUsersController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const users = await usersRepository.listUsers();
  res.json({ success: true, data: users });
};

export const createUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const username = normalize(req.body?.username);
  const email = normalize(req.body?.email).toLowerCase();
  const displayName = normalize(req.body?.displayName);
  const password = normalize(req.body?.password);
  const isAdmin = Boolean(req.body?.isAdmin);
  const mustChangePassword = req.body?.mustChangePassword !== false;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'username, email and password are required' });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    return;
  }

  if (await usersRepository.existsByUsername(username)) {
    res.status(409).json({ error: 'Username already exists' });
    return;
  }

  if (await usersRepository.existsByEmail(email)) {
    res.status(409).json({ error: 'Email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await usersRepository.createUser({
    username,
    email,
    displayName,
    passwordHash,
    isAdmin,
    mustChangePassword
  });

  res.status(201).json({ success: true, data: created });
};

export const updateUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const userId = Number(req.params.userId);
  if (!Number.isFinite(userId) || userId <= 0) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }

  const username = normalize(req.body?.username);
  const email = normalize(req.body?.email).toLowerCase();
  const displayName = normalize(req.body?.displayName);
  const isAdmin = Boolean(req.body?.isAdmin);
  const mustChangePassword = typeof req.body?.mustChangePassword === 'boolean'
    ? req.body.mustChangePassword
    : undefined;

  if (!username || !email) {
    res.status(400).json({ error: 'username and email are required' });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }

  if (await usersRepository.existsByUsername(username, userId)) {
    res.status(409).json({ error: 'Username already exists' });
    return;
  }

  if (await usersRepository.existsByEmail(email, userId)) {
    res.status(409).json({ error: 'Email already exists' });
    return;
  }

  const updated = await usersRepository.updateUser(userId, {
    username,
    email,
    displayName,
    isAdmin,
    mustChangePassword
  });

  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ success: true, data: updated });
};

export const adminSetUserPasswordController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const userId = Number(req.params.userId);
  const newPassword = normalize(req.body?.newPassword);
  const mustChangePassword = req.body?.mustChangePassword !== false;

  if (!Number.isFinite(userId) || userId <= 0) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }

  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    return;
  }

  const target = await usersRepository.getUserById(userId);
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await usersRepository.updateUserPassword(userId, hash, mustChangePassword);
  const updated = await usersRepository.getUserById(userId);

  res.json({ success: true, data: updated });
};

export const changeOwnPasswordController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const currentPassword = normalize(req.body?.currentPassword);
  const newPassword = normalize(req.body?.newPassword);

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'currentPassword and newPassword are required' });
    return;
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    return;
  }

  const authUser = await usersRepository.getAuthUserById(userId);
  if (!authUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, authUser.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Current password is invalid' });
    return;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await usersRepository.updateUserPassword(userId, hash, false);

  const updated = await usersRepository.getUserById(userId);
  res.json({ success: true, data: updated });
};