const path = require("path");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function getEnv(name, fallback = "") {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return value;
}

function toPort(value, fallback = 3306) {
  const parsed = Number.parseInt(value, 10);
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

async function migrate() {
  const host = getEnv("DB_HOST", "localhost");
  const port = toPort(getEnv("DB_PORT", "3306"), 3306);
  const user = getEnv("DB_USER", "root");
  const password = getEnv("DB_PASSWORD", "");
  const database = getEnv("DB_NAME", "imobiliaria_db");
  const useSsl = toBool(getEnv("DB_SSL", "false"), false);
  const sslRejectUnauthorized = toBool(getEnv("DB_SSL_REJECT_UNAUTHORIZED", "true"), true);

  const sslOptions = useSsl
    ? {
        ssl: {
          rejectUnauthorized: sslRejectUnauthorized,
        },
      }
    : {};

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
    ...sslOptions,
  });

  try {
    await connection.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS public_phone VARCHAR(25) NULL AFTER phone_encrypted,
      ADD COLUMN IF NOT EXISTS license_number VARCHAR(60) NULL AFTER public_phone,
      ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) NULL AFTER license_number
    `);

    console.log("Migracao concluida: campos de cartao digital adicionados em users.");
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error("Erro na migracao de cartao digital:", error.message);
  process.exit(1);
});
