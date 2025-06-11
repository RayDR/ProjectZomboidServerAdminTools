"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const fs_1 = require("fs");
const path_1 = require("path");
const auth_1 = __importDefault(require("./routes/auth"));
const health_1 = __importDefault(require("./routes/health"));
const status_1 = __importDefault(require("./routes/status"));
const logs_1 = __importDefault(require("./routes/logs"));
const ini_1 = __importDefault(require("./routes/ini"));
const commands_1 = __importDefault(require("./routes/commands"));
const app = (0, express_1.default)();
const PORT = env_1.config.port;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', auth_1.default);
app.use('/api/health', health_1.default);
app.use('/api/status', status_1.default);
app.use('/api/logs', logs_1.default);
app.use('/api/config/ini', ini_1.default);
app.use('/api/commands', commands_1.default);
const version = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../package.json'), 'utf-8')).version;
app.listen(PORT, () => {
    console.log(`🚀 PZWebAdmin-API v${version} running on port ${PORT}`);
});
