const { auth } = require("../config/env");
const { verifyAuthToken } = require("../services/tokenService");
const User = require("../models/User");

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7).trim();
}

async function requireAuth(req, res, next) {
  try {
    const cookieToken = req.cookies ? req.cookies[auth.cookieName] : null;
    const bearerToken = extractBearerToken(req);
    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({ message: "Nao autenticado." });
    }

    const payload = verifyAuthToken(token);

    const user = await User.findOne({
      where: {
        id: payload.sub,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Sessao invalida." });
    }

    req.authUser = user;
    req.authToken = token;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido ou expirado." });
  }
}

async function attachAuthUserIfAvailable(req, res, next) {
  try {
    const cookieToken = req.cookies ? req.cookies[auth.cookieName] : null;
    const bearerToken = extractBearerToken(req);
    const token = cookieToken || bearerToken;

    if (!token) {
      next();
      return;
    }

    const payload = verifyAuthToken(token);

    const user = await User.findOne({
      where: {
        id: payload.sub,
        deletedAt: null,
      },
    });

    if (user) {
      req.authUser = user;
      req.authToken = token;
    }

    next();
  } catch (error) {
    next();
  }
}

module.exports = {
  requireAuth,
  attachAuthUserIfAvailable,
};
