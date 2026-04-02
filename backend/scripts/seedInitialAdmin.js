const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { sequelize } = require("../config/database");
const User = require("../models/User");
const { hashPassword, normalizeEmail, isValidEmail, isValidPassword } = require("../services/authService");

async function seedInitialAdmin() {
  const firstName = (process.env.ADMIN_BOOTSTRAP_FIRST_NAME || "Admin").trim();
  const lastName = (process.env.ADMIN_BOOTSTRAP_LAST_NAME || "Principal").trim();
  const email = normalizeEmail(process.env.ADMIN_BOOTSTRAP_EMAIL || "");
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "";

  if (!email || !password) {
    console.error("Define ADMIN_BOOTSTRAP_EMAIL e ADMIN_BOOTSTRAP_PASSWORD no .env para criar o admin inicial.");
    process.exit(1);
  }

  if (!isValidEmail(email)) {
    console.error("ADMIN_BOOTSTRAP_EMAIL invalido.");
    process.exit(1);
  }

  if (!isValidPassword(password)) {
    console.error("ADMIN_BOOTSTRAP_PASSWORD fraca. Minimo 8 caracteres com letras e numeros.");
    process.exit(1);
  }

  await sequelize.authenticate();

  const existingAdmin = await User.findOne({ where: { role: "admin" } });
  if (existingAdmin) {
    console.log("Ja existe pelo menos um admin. Seed nao necessario.");
    process.exit(0);
  }

  const emailInUse = await User.findOne({ where: { email } });
  if (emailInUse) {
    console.error("Email ja existe na base de dados. Usa outro email para bootstrap.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    role: "admin",
  });

  console.log("Admin inicial criado com sucesso.");
  process.exit(0);
}

seedInitialAdmin().catch((error) => {
  console.error("Erro ao criar admin inicial:", error.message);
  process.exit(1);
});
