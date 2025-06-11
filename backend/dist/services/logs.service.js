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
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLogFile = void 0;
const child_process_1 = require("child_process");
const env_1 = require("../config/env");
/**
 * Read the last N lines from either the main or maintenance log.
 * @param type 'main' or 'maintenance'
 * @param lines number of lines to read
 */
const readLogFile = (type, lines) => {
    const logPath = type === 'maintenance' ? env_1.config.pzMaintenanceLogPath : env_1.config.pzLogPath;
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(`tail -n ${lines} ${logPath}`, (err, stdout, stderr) => {
            if (err)
                return reject(stderr || err.message);
            resolve(stdout);
        });
    });
};
exports.readLogFile = readLogFile;
