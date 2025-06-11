"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCommand = void 0;
const commands_service_1 = require("../services/commands.service");
/**
 * Controller to execute a shell command based on the requested action.
 * Supported actions: restart, stop, start, update, backup, status.
 */
const executeCommand = async (req, res) => {
    const { action } = req.body;
    if (!action) {
        return res.status(400).json({ error: 'Missing action parameter' });
    }
    try {
        const output = await (0, commands_service_1.runCommand)(action);
        res.json({ message: `Action '${action}' executed successfully.`, output });
    }
    catch (err) {
        res.status(500).json({
            error: `Failed to execute action '${action}'`,
            details: err instanceof Error ? err.message : err,
        });
    }
};
exports.executeCommand = executeCommand;
