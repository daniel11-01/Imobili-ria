const User = require("../models/User");
const { Op } = require("sequelize");
const {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  sanitizeUser,
  hashPassword,
} = require("../services/authService");

async function createAdmin(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Campos obrigatorios em falta." });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email invalido." });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Password fraca. Minimo 8 caracteres, com letras e numeros." });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: "Email ja registado." });
    }

    const passwordHash = await hashPassword(password);

    const adminUser = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "admin",
    });

    return res.status(201).json({ user: sanitizeUser(adminUser) });
  } catch (error) {
    return res.status(500).json({ message: "Erro interno ao criar admin." });
  }
}

async function listUsers(req, res) {
  try {
    const role = String(req.query.role || "").trim();
    const search = String(req.query.search || "").trim();

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: ["id", "firstName", "lastName", "email", "role", "createdAt"],
      order: [
        ["firstName", "ASC"],
        ["lastName", "ASC"],
      ],
    });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Erro interno ao listar utilizadores." });
  }
}

module.exports = {
  createAdmin,
  listUsers,
};
