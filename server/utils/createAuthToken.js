const jwt = require('jsonwebtoken');
const config = require('../config');

function createAuthToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

module.exports = { createAuthToken };
