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
exports.executeCommand = void 0;
const commands_service_1 = require("../services/commands.service");
const rcon_service_1 = require("../services/rcon.service");
/**
 * Controller to execute a shell command based on the requested action.
 * Supported actions: restart, stop, start, update, backup, status, rcon.
 */
const executeCommand = async (req, res) => {
    const { action, command } = req.body;
    if (!action) {
        return res.status(400).json({ error: 'Missing action parameter' });
    }
    try {
        // Handle RCON commands separately
        if (action === 'rcon') {
            if (!command) {
                return res.status(400).json({ error: 'Missing command parameter for RCON' });
            }
            const output = await (0, rcon_service_1.runRconCommand)(command);
            return res.json({ success: true, message: 'RCON command executed', output });
        }
        // Handle system commands
        const output = await (0, commands_service_1.runCommand)(action);
        res.json({ success: true, message: `Action '${action}' executed successfully.`, output });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: `Failed to execute action '${action}'`,
            details: err instanceof Error ? err.message : err,
        });
    }
};
exports.executeCommand = executeCommand;
