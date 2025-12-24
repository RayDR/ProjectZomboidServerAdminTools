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
exports.getConnectedPlayers = void 0;
const rcon_service_1 = require("../services/rcon.service");
/**
 * Handles the `/api/players` endpoint.
 * Returns a list of currently connected players via RCON.
 */
const getConnectedPlayers = async (_req, res) => {
    try {
        const raw = await (0, rcon_service_1.runRconCommand)('players');
        const players = parsePlayers(raw);
        res.json({ players });
    }
    catch (err) {
        res.status(500).json({
            error: 'Failed to retrieve player list.',
            details: err.message,
        });
    }
};
exports.getConnectedPlayers = getConnectedPlayers;
/**
 * Parses the raw RCON response to extract player names.
 */
const parsePlayers = (raw) => {
    return raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('There are no'));
};
