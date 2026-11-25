const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createToken(user) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { hashPassword, verifyPassword, createToken, verifyToken };
