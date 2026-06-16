const jwt = require('jsonwebtoken');
const users = require('../db/users');
const config = require('../config');

function readBearerToken(req) {
  const authorization = req.get('Authorization');
  if (!authorization) return null;

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  return token;
}

async function authenticateToken(req, res, next) {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization Bearer token is required' });
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const activeUserId = Number(payload.id);
  if (!Number.isInteger(activeUserId) || activeUserId < 1) {
    return res.status(401).json({ error: 'Token payload is invalid' });
  }

  const activeUser = await users.getActiveUserById(activeUserId);
  if (!activeUser) {
    return res.status(401).json({ error: 'Token does not reference an active user' });
  }

  req.auth = payload;
  req.activeUserId = activeUserId;
  req.activeUser = activeUser;
  next();
}

module.exports = { authenticateToken };
