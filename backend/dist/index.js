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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const players_1 = __importDefault(require("./routes/players"));
const messages_1 = __importDefault(require("./routes/messages"));
const server_1 = __importDefault(require("./routes/server"));
const mods_1 = __importDefault(require("./routes/mods"));
const instances_1 = __importDefault(require("./routes/instances"));
const auth_2 = require("./middleware/auth");
const instancesController = __importStar(require("./controllers/instances.controller"));
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
app.use('/api/players', players_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/server', server_1.default);
app.use('/api/mods', mods_1.default);
app.get('/api/versions', auth_2.auth, (req, res) => { void instancesController.getAvailableVersionsController(req, res); });
app.use('/api/instances', instances_1.default);
const monitoring_service_1 = require("./services/monitoring.service");
const version = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../package.json'), 'utf-8')).version;
app.listen(PORT, () => {
    console.log(`🚀 PZWebAdmin-API v${version} running on port ${PORT}`);
    console.log(`📝 INI Path: ${env_1.config.pzIniPath}`);
    (0, monitoring_service_1.startMonitoring)();
});
