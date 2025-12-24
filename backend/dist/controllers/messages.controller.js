"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastMessage = void 0;
const rcon_service_1 = require("../services/rcon.service");
/**
 * Controller to broadcast a message to the PZ server via RCON.
 */
const broadcastMessage = async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }
    try {
        const result = await (0, rcon_service_1.sendServerMessage)(message);
        res.json({ message: 'Broadcast sent', result });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to send broadcast', details: err.message });
    }
};
exports.broadcastMessage = broadcastMessage;
