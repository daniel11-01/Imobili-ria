const rateLimit = require("express-rate-limit");

const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Muitas tentativas de contacto. Tenta novamente daqui a alguns minutos.",
  },
});

module.exports = {
  contactRateLimit,
};
