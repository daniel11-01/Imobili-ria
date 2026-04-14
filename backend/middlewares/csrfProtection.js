const { auth } = require("../config/env");
const {
  generateCsrfToken,
  setCsrfCookie,
  getCsrfHeaderValue,
} = require("../services/csrfService");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function issueCsrfToken(req, res, next) {
  const existingCookieToken = String(req.cookies?.[auth.csrfCookieName] || "").trim();

  if (existingCookieToken) {
    req.csrfToken = existingCookieToken;
    next();
    return;
  }

  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  req.csrfToken = token;
  next();
}

function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const cookieToken = String(req.cookies?.[auth.csrfCookieName] || "").trim();
  const headerToken = getCsrfHeaderValue(req);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ message: "Falha de validacao CSRF." });
    return;
  }

  next();
}

module.exports = {
  issueCsrfToken,
  requireCsrf,
};
