const jwt = require("jsonwebtoken");
const { auth } = require("../config/env");

function createAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    auth.jwtSecret,
    {
      expiresIn: auth.jwtExpiresIn,
    }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, auth.jwtSecret);
}

module.exports = {
  createAuthToken,
  verifyAuthToken,
};
