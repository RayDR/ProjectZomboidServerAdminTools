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

import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { readFileSync } from 'fs';
import { join } from 'path';

import authRoutes from './routes/auth';
import healthRouter from './routes/health';
import statusRouter from './routes/status';
import logRoutes from './routes/logs';
import iniRoutes from './routes/ini';
import commandRoutes from './routes/commands';
import playerRoutes from './routes/players';
import messageRoutes from './routes/messages';
import serverRoutes from './routes/server';
import modsRoutes from './routes/mods';

const app = express();
const PORT = config.port;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/health', healthRouter);
app.use('/api/status', statusRouter);
app.use('/api/logs', logRoutes);
app.use('/api/config/ini', iniRoutes);
app.use('/api/commands', commandRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/mods', modsRoutes);

const version = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')).version;

app.listen(PORT, () => {
  console.log(`🚀 PZWebAdmin-API v${version} running on port ${PORT}`);
  console.log(`📝 INI Path: ${config.pzIniPath}`);
});
