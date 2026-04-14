const test = require("node:test");
const assert = require("node:assert/strict");

const authController = require("../controllers/authController");
const { auth } = require("../config/env");
const User = require("../models/User");
const { PasswordResetToken } = require("../models");
const { hashPassword } = require("../services/authService");
const { createMockRes, mockMethod } = require("./helpers/httpMock");

test("login autentica utilizador com credenciais validas", async () => {
  const passwordHash = await hashPassword("Admin12345");
  const restoreFindOne = mockMethod(User, "findOne", async () => ({
    id: 99,
    firstName: "Admin",
    lastName: "Teste",
    email: "admin@imobiliaria.local",
    role: "admin",
    passwordHash,
    createdAt: new Date(),
  }));

  const req = {
    body: {
      email: "admin@imobiliaria.local",
      password: "Admin12345",
    },
  };
  const res = createMockRes();

  try {
    await authController.login(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.user.email, "admin@imobiliaria.local");
    assert.equal(res.cookies.length, 2);
    assert.ok(res.cookies.some((cookie) => cookie.name === auth.cookieName));
    assert.ok(res.cookies.some((cookie) => cookie.name === auth.csrfCookieName));
  } finally {
    restoreFindOne();
  }
});

test("forgot password devolve sempre resposta generica para email inexistente", async () => {
  const restoreSync = mockMethod(PasswordResetToken, "sync", async () => undefined);
  const restoreDestroy = mockMethod(PasswordResetToken, "destroy", async () => 0);
  const restoreFindOne = mockMethod(User, "findOne", async () => null);

  const req = {
    body: {
      email: "nao-existe@imobiliaria.local",
    },
  };
  const res = createMockRes();

  try {
    await authController.forgotPassword(req, res);

    assert.equal(res.statusCode, 202);
    assert.match(res.payload.message, /Se o email existir/i);
  } finally {
    restoreSync();
    restoreDestroy();
    restoreFindOne();
  }
});

test("reset password rejeita token invalido", async () => {
  const restoreSync = mockMethod(PasswordResetToken, "sync", async () => undefined);
  const restoreDestroy = mockMethod(PasswordResetToken, "destroy", async () => 0);
  const restoreFindReset = mockMethod(PasswordResetToken, "findOne", async () => null);

  const req = {
    body: {
      token: "token-invalido",
      newPassword: "Nova12345",
    },
  };
  const res = createMockRes();

  try {
    await authController.resetPassword(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.payload.message, /Token invalido ou expirado/i);
  } finally {
    restoreSync();
    restoreDestroy();
    restoreFindReset();
  }
});
