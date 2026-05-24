"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeOwnPasswordController = exports.adminSetUserPasswordController = exports.updateUserController = exports.createUserController = exports.getUsersController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const users_repository_1 = require("../repositories/users.repository");
const MIN_PASSWORD_LENGTH = 6;
const normalize = (value) => String(value || '').trim();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const getUsersController = async (req, res) => {
    if (!req.user?.isAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    const users = await users_repository_1.usersRepository.listUsers();
    res.json({ success: true, data: users });
};
exports.getUsersController = getUsersController;
const createUserController = async (req, res) => {
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
    if (await users_repository_1.usersRepository.existsByUsername(username)) {
        res.status(409).json({ error: 'Username already exists' });
        return;
    }
    if (await users_repository_1.usersRepository.existsByEmail(email)) {
        res.status(409).json({ error: 'Email already exists' });
        return;
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const created = await users_repository_1.usersRepository.createUser({
        username,
        email,
        displayName,
        passwordHash,
        isAdmin,
        mustChangePassword
    });
    res.status(201).json({ success: true, data: created });
};
exports.createUserController = createUserController;
const updateUserController = async (req, res) => {
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
    if (await users_repository_1.usersRepository.existsByUsername(username, userId)) {
        res.status(409).json({ error: 'Username already exists' });
        return;
    }
    if (await users_repository_1.usersRepository.existsByEmail(email, userId)) {
        res.status(409).json({ error: 'Email already exists' });
        return;
    }
    const updated = await users_repository_1.usersRepository.updateUser(userId, {
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
exports.updateUserController = updateUserController;
const adminSetUserPasswordController = async (req, res) => {
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
    const target = await users_repository_1.usersRepository.getUserById(userId);
    if (!target) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const hash = await bcrypt_1.default.hash(newPassword, 10);
    await users_repository_1.usersRepository.updateUserPassword(userId, hash, mustChangePassword);
    const updated = await users_repository_1.usersRepository.getUserById(userId);
    res.json({ success: true, data: updated });
};
exports.adminSetUserPasswordController = adminSetUserPasswordController;
const changeOwnPasswordController = async (req, res) => {
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
    const authUser = await users_repository_1.usersRepository.getAuthUserById(userId);
    if (!authUser) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const valid = await bcrypt_1.default.compare(currentPassword, authUser.password_hash);
    if (!valid) {
        res.status(401).json({ error: 'Current password is invalid' });
        return;
    }
    const hash = await bcrypt_1.default.hash(newPassword, 10);
    await users_repository_1.usersRepository.updateUserPassword(userId, hash, false);
    const updated = await users_repository_1.usersRepository.getUserById(userId);
    res.json({ success: true, data: updated });
};
exports.changeOwnPasswordController = changeOwnPasswordController;
