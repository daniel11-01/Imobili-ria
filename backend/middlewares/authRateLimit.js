const rateLimit = require("express-rate-limit");
const { auth } = require("../config/env");

function buildLimiter(limit, message) {
  return rateLimit({
    windowMs: auth.authRateLimitWindowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message,
    },
  });
}

const loginRateLimit = buildLimiter(
  auth.authLoginRateLimitMax,
  "Demasiadas tentativas de login. Tenta novamente em alguns minutos."
);

const forgotPasswordRateLimit = buildLimiter(
  auth.authForgotRateLimitMax,
  "Demasiados pedidos de recuperacao de password. Tenta novamente em alguns minutos."
);

const resetPasswordRateLimit = buildLimiter(
  auth.authResetRateLimitMax,
  "Demasiadas tentativas de redefinicao de password. Tenta novamente em alguns minutos."
);

module.exports = {
  loginRateLimit,
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
};
