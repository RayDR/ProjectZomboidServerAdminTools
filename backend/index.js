require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3131;

const auth = require('./middleware/auth');

const PZENV = '/opt/pzserver/scripts/pzenv';
const shellCmd = (cmd) => `/bin/bash -c "source ${PZENV} && ${cmd}"`;

app.use(cors());
app.use(express.json());


const bcrypt = require('bcrypt');
const crypto = require('crypto');

app.post('/api/login', (req, res) => {
  const { token } = req.body;
  
  res.status(501).json({ error: 'Not Implemented' });
  if (!token) {
    return res.status(422).json({ message: 'Token required' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = crypto.randomBytes(24).toString('hex');
    db.run(`INSERT INTO sessions (token, user_id) VALUES (?, ?)`, [token, user.id]);
    db.run(`INSERT INTO audit_logs (user_id, action) VALUES (?, ?)`, [user.id, 'login']);

    res.json({ token });
  });
});


app.get('/api/logs/:type', auth, (req, res) => {
  const lines = req.query.lines || 100;
  const type = req.params.type;
  let logPath = type === 'maintenance'
    ? '/opt/pzserver/logs/maintenance.log'
    : process.env.PZ_LOG || '/opt/pzserver/logs/server.log';

  exec(`tail -n ${lines} ${logPath}`, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
});

app.post('/api/command/restart', auth, (req, res) => {
  exec(shellCmd('pzfullrestart'), (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
});

app.post('/api/command/backup', auth, (req, res) => {
  exec(shellCmd('pzbackup'), (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
});

app.post('/api/command/fullupdate', auth, (req, res) => {
  exec(shellCmd('pzfullupdate'), (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
});

app.get('/api/players', auth, (req, res) => {
  exec(shellCmd('pzplayers'), (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
});

app.get('/api/errors', auth, (req, res) => {
  const lines = req.query.lines || 50;
  exec(shellCmd(`pzerrors ${lines}`), (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
});

app.get('/api/config/ini', auth, (req, res) => {
  fs.readFile('./vi Zomboid/Server/server.ini', 'utf-8', (err, data) => {
    if (err) return res.status(500).send(err.message);
    res.send(data);
  });
});

app.post('/api/config/ini', auth, (req, res) => {
  const content = req.body.content;
  fs.writeFile('./Zomboid/Server/server.ini', content, (err) => {
    if (err) return res.status(500).send(err.message);
    
    if (req.user?.id) {
      db.run(`INSERT INTO audit_logs (user_id, action) VALUES (?, ?)`, [req.user.id, 'INI updated']);
    }

    console.log(`ini file updated`);
    res.send('ini file updated');
  });
});

app.get('/api/status', auth, (req, res) => {
  exec(shellCmd('pzstatus'), (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr || err.message);
    res.send(stdout.trim() || 'inactive');
  });
});


app.listen(PORT, () => {
  console.log(`PZ WebAdmin API running on port ${PORT}`);
});
