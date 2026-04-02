const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

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

async function initDatabase() {
  const host = getEnv("DB_HOST", "localhost");
  const port = toPort(getEnv("DB_PORT", "3306"), 3306);
  const user = getEnv("DB_USER", "root");
  const password = getEnv("DB_PASSWORD", "");
  const dbName = getEnv("DB_NAME", "imobiliaria_db");

  const rootConnection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  const escapedDbName = dbName.replace(/`/g, "");
  await rootConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${escapedDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await rootConnection.end();

  const schemaPath = path.resolve(__dirname, "../sql/schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  const dbConnection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: escapedDbName,
    multipleStatements: true,
  });

  await dbConnection.query(schemaSql);
  await dbConnection.end();

  console.log(`Base de dados inicializada com sucesso: ${escapedDbName}`);
}

initDatabase().catch((error) => {
  console.error("Erro ao inicializar a base de dados:", error.message);
  process.exit(1);
});
