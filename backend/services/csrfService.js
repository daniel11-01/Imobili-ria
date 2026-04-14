const crypto = require("crypto");
const { auth } = require("../config/env");

function buildCsrfCookieOptions() {
  return {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    maxAge: auth.cookieMaxAgeMs,
    path: "/",
  };
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

function setCsrfCookie(res, token) {
  res.cookie(auth.csrfCookieName, token, buildCsrfCookieOptions());
}

function clearCsrfCookie(res) {
  res.clearCookie(auth.csrfCookieName, {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    path: "/",
  });
}

function getCsrfHeaderValue(req) {
  const headerName = String(auth.csrfHeaderName || "x-csrf-token").toLowerCase();
  return String(req.headers?.[headerName] || "").trim();
}

module.exports = {
  generateCsrfToken,
  setCsrfCookie,
  clearCsrfCookie,
  getCsrfHeaderValue,
};
