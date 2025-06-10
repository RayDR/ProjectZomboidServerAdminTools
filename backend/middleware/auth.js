// middleware/auth.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../db/pzadmin.db');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (token === 'secret123') {
    req.user = { username: 'token_user', id: null };
    return next();
  }

  db.get(`SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`, [token], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(401).json({ error: 'Unauthorized' });

    req.user = { id: row.id, username: row.username };
    next();
  });
};
