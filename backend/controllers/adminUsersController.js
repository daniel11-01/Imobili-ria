const User = require("../models/User");
const { Op } = require("sequelize");
const {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  sanitizeUser,
  hashPassword,
} = require("../services/authService");

function toInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function sanitizeSearchTerm(value, maxLength = 60) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/[\r\n\t]/g, " ").replace(/[%_]/g, "").slice(0, maxLength);
}

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
    const all = String(req.query.all || "").trim().toLowerCase() === "true";
    const page = Math.max(toInt(req.query.page, 1), 1);
    const pageSize = Math.min(Math.max(toInt(req.query.pageSize, 20), 1), 100);
    const offset = (page - 1) * pageSize;
    const role = String(req.query.role || "").trim();
    const search = sanitizeSearchTerm(req.query.search, 60);

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `${search}%` } },
        { lastName: { [Op.like]: `${search}%` } },
        { email: { [Op.like]: `${search}%` } },
      ];
    }

    if (all) {
      const users = await User.findAll({
        where,
        attributes: ["id", "firstName", "lastName", "email", "role", "publicPhone", "licenseNumber", "avatarUrl", "createdAt"],
        order: [
          ["firstName", "ASC"],
          ["lastName", "ASC"],
        ],
      });

      return res.status(200).json({
        users,
        pagination: {
          page: 1,
          pageSize: users.length,
          total: users.length,
          totalPages: users.length > 0 ? 1 : 0,
        },
      });
    }

    const result = await User.findAndCountAll({
      where,
      attributes: ["id", "firstName", "lastName", "email", "role", "publicPhone", "licenseNumber", "avatarUrl", "createdAt"],
      order: [
        ["firstName", "ASC"],
        ["lastName", "ASC"],
      ],
      offset,
      limit: pageSize,
    });

    const total = result.count;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

    return res.status(200).json({
      users: result.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro interno ao listar utilizadores." });
  }
}

module.exports = {
  createAdmin,
  listUsers,
};
