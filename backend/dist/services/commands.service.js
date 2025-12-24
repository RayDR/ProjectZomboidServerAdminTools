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
exports.runCommand = void 0;
const child_process_1 = require("child_process");
const env_1 = require("../config/env");
/**
 * Run a specific shell command based on the action name.
 */
const runCommand = (action) => {
    const commands = {
        restart: `sudo systemctl restart ${env_1.config.pzService}`,
        status: `sudo systemctl status ${env_1.config.pzService}`,
        start: `sudo systemctl start ${env_1.config.pzService}`,
        stop: `sudo systemctl stop ${env_1.config.pzService}`,
        update: `${env_1.config.pzSteamcmdPath} +login anonymous +force_install_dir ${env_1.config.pzDir} +app_update 380870 validate +quit`,
        backup: `sudo /opt/pzserver/scripts/backup.sh`,
    };
    const cmd = commands[action];
    if (!cmd) {
        return Promise.reject(new Error(`Unsupported action: ${action}`));
    }
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(cmd, (err, stdout, stderr) => {
            if (err)
                return reject(stderr || err.message);
            resolve(stdout.trim());
        });
    });
};
exports.runCommand = runCommand;
