"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = void 0;
/**
 * Login controller: validates password and returns a static token.
 */
const loginUser = async (req, res) => {
    const { password } = req.body;
    if (password === 'admin123') {
        return res.json({ token: 'secret123' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
};
exports.loginUser = loginUser;
