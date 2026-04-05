const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  const value = String(email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(password) {
  const value = String(password || "");
  const longEnough = value.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  return longEnough && hasLetter && hasNumber;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const source = typeof user.get === "function" ? user.get({ plain: true }) : user;

  return {
    id: source.id,
    firstName: source.firstName,
    lastName: source.lastName,
    email: source.email,
    publicPhone: source.publicPhone || null,
    licenseNumber: source.licenseNumber || null,
    avatarUrl: source.avatarUrl || null,
    role: source.role,
    createdAt: source.createdAt,
  };
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(rawPassword, hashedPassword) {
  return bcrypt.compare(rawPassword, hashedPassword);
}

module.exports = {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  sanitizeUser,
  hashPassword,
  comparePassword,
};
