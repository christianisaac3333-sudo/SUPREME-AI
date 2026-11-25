const express = require('express');
const { hashPassword, verifyPassword, createToken } = require('./auth');

const router = express.Router();

// Temporary prototype store; users disappear when the server restarts.
const users = [];

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' ||
        !email.trim() || password.length < 8 || password.length > 200) {
      return res.status(400).json({ error: 'Valid email and password (8+ characters) required.' });
    }

    const normalized = email.trim().toLowerCase();
    if (users.some(u => u.email === normalized))
      return res.status(409).json({ error: 'Account already exists.' });

    const user = { id: String(Date.now()), email: normalized, hash: await hashPassword(password) };
    users.push(user);
    res.status(201).json({ token: createToken(user), email: user.email });
  } catch {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'Email and password required.' });

    const user = users.find(u => u.email === email.trim().toLowerCase());
    if (!user || !(await verifyPassword(password, user.hash)))
      return res.status(401).json({ error: 'Invalid credentials.' });

    res.json({ token: createToken(user), email: user.email });
  } catch {
    res.status(500).json({ error: 'Login failed.' });
  }
});

module.exports = router;
