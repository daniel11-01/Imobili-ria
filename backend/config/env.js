const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toFloat(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["1", "true", "sim", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "nao", "não", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function normalizePublicPath(value, fallback = "/uploads") {
  const raw = String(value || "").trim();
  const selected = raw || fallback;
  const normalized = `/${selected.replace(/^\/+|\/+$/g, "")}`;
  return normalized === "/" ? fallback : normalized;
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const config = {
  app: {
    nodeEnv: process.env.NODE_ENV || "development",
    port: toInt(process.env.PORT, 5000),
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  },
  storage: {
    uploadsRoot: path.resolve(process.cwd(), process.env.UPLOADS_ROOT || "./public/uploads"),
    uploadsPublicPath: normalizePublicPath(process.env.UPLOADS_PUBLIC_PATH || "/uploads"),
    uploadsPublicBaseUrl: normalizeBaseUrl(process.env.UPLOADS_PUBLIC_BASE_URL || ""),
  },
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: toInt(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME || "imobiliaria_db",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    dialect: "mariadb",
    connectTimeoutMs: toInt(process.env.DB_CONNECT_TIMEOUT_MS, 20000),
    ssl: toBool(process.env.DB_SSL, false),
    sslRejectUnauthorized: toBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
    logging: process.env.DB_LOGGING === "true",
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || "",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
    cookieName: process.env.AUTH_COOKIE_NAME || "imobiliaria_auth",
    csrfCookieName: process.env.CSRF_COOKIE_NAME || "imobiliaria_csrf",
    csrfHeaderName: process.env.CSRF_HEADER_NAME || "x-csrf-token",
    cookieMaxAgeMs: toInt(process.env.JWT_COOKIE_MAX_AGE_MS, 24 * 60 * 60 * 1000),
    passwordResetUrl:
      process.env.FRONTEND_RESET_PASSWORD_URL ||
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password`,
    passwordResetTokenTtlMinutes: toInt(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES, 30),
    authRateLimitWindowMs: toInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    authLoginRateLimitMax: toInt(process.env.AUTH_LOGIN_RATE_LIMIT_MAX, 10),
    authForgotRateLimitMax: toInt(process.env.AUTH_FORGOT_RATE_LIMIT_MAX, 5),
    authResetRateLimitMax: toInt(process.env.AUTH_RESET_RATE_LIMIT_MAX, 8),
    passwordResetCleanupAgeHours: toInt(process.env.PASSWORD_RESET_CLEANUP_AGE_HOURS, 48),
    passwordResetCleanupIntervalMs: toInt(process.env.PASSWORD_RESET_CLEANUP_INTERVAL_MS, 10 * 60 * 1000),
  },
  mail: {
    host: process.env.SMTP_HOST || "",
    port: toInt(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromName: process.env.SMTP_FROM_NAME || "Imobiliaria Site",
    fromEmail: process.env.SMTP_FROM_EMAIL || "no-reply@imobiliaria.local",
  },
  recaptcha: {
    secretKey: process.env.RECAPTCHA_SECRET_KEY || "",
    enabled: toBool(process.env.RECAPTCHA_ENABLED, true),
    verifyUrl: process.env.RECAPTCHA_VERIFY_URL || "https://www.google.com/recaptcha/api/siteverify",
    minScore: toFloat(process.env.RECAPTCHA_MIN_SCORE, 0.5),
  },
};

function validateConfig(currentConfig) {
  const jwtSecret = String(currentConfig.auth.jwtSecret || "").trim();
  const nodeEnv = String(currentConfig.app.nodeEnv || "development").trim().toLowerCase();

  if (!jwtSecret) {
    throw new Error("JWT_SECRET e obrigatorio. Define este valor no ficheiro .env.");
  }

  if (nodeEnv === "production" && ["dev-secret", "trocar_esta_chave_em_producao"].includes(jwtSecret)) {
    throw new Error("JWT_SECRET inseguro. Usa uma chave aleatoria forte no .env.");
  }
}

validateConfig(config);

module.exports = config;
