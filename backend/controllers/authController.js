const { Op } = require("sequelize");
const crypto = require("crypto");
const { app, auth } = require("../config/env");
const { sequelize } = require("../config/database");
const { Property, PropertyImage, PasswordResetToken } = require("../models");
const User = require("../models/User");
const { createAuthToken } = require("../services/tokenService");
const { sendPasswordResetEmail } = require("../services/emailService");
const { processUserAvatar, deleteImageByUrl } = require("../services/propertyMediaService");
const {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  sanitizeUser,
  hashPassword,
  comparePassword,
} = require("../services/authService");

let ensurePasswordResetTablePromise;
let lastPasswordResetCleanupAt = 0;

async function ensurePasswordResetTable() {
  if (!ensurePasswordResetTablePromise) {
    ensurePasswordResetTablePromise = PasswordResetToken.sync();
  }

  await ensurePasswordResetTablePromise;
}

function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(String(rawToken || "")).digest("hex");
}

async function cleanupPasswordResetTokensIfNeeded() {
  const now = Date.now();
  if (now - lastPasswordResetCleanupAt < auth.passwordResetCleanupIntervalMs) {
    return;
  }

  lastPasswordResetCleanupAt = now;

  const thresholdDate = new Date(Date.now() - auth.passwordResetCleanupAgeHours * 60 * 60 * 1000);

  await PasswordResetToken.destroy({
    where: {
      [Op.or]: [
        {
          usedAt: {
            [Op.not]: null,
          },
          createdAt: {
            [Op.lte]: thresholdDate,
          },
        },
        {
          expiresAt: {
            [Op.lte]: thresholdDate,
          },
        },
      ],
    },
  });
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: true ,
    sameSite: "none",
    maxAge: auth.cookieMaxAgeMs,
    path: "/",
  };
}

function setAuthCookie(res, token) {
  res.cookie(auth.cookieName, token, buildCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(auth.cookieName, {
    httpOnly: true,
    secure: true, // Sempre true para produção/cross-domain
    sameSite: "none", // Permite envio cross-domain
    path: "/",
  });
}

function parseBooleanLike(value) {
  if (value === true || value === false) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "nao", "não", "no"].includes(normalized)) {
      return false;
    }
  }

  return false;
}

async function register(req, res) {
  try {
    const { firstName, lastName, email, password, acceptPrivacyPolicy } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Campos obrigatorios em falta." });
    }

    if (acceptPrivacyPolicy !== true) {
      return res.status(400).json({ message: "Consentimento RGPD obrigatorio." });
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

    const user = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "cliente",
    });

    const token = createAuthToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro interno ao registar utilizador." });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email e password sao obrigatorios." });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Credenciais invalidas." });
    }

    const passwordOk = await comparePassword(password, user.passwordHash);

    if (!passwordOk) {
      return res.status(401).json({ message: "Credenciais invalidas." });
    }

    const token = createAuthToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Erro interno ao autenticar utilizador." });
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  return res.status(204).send();
}

function me(req, res) {
  return res.status(200).json({ user: sanitizeUser(req.authUser) });
}

async function updateMe(req, res) {
  let newAvatarUrl = null;

  try {
    const { firstName, lastName, email } = req.body || {};

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "Nome, apelido e email sao obrigatorios." });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email invalido." });
    }

    const duplicatedEmailUser = await User.findOne({
      where: {
        email: normalizedEmail,
        id: {
          [Op.ne]: req.authUser.id,
        },
      },
    });

    if (duplicatedEmailUser) {
      return res.status(409).json({ message: "Email ja esta em uso." });
    }

    const safeFirstName = String(firstName).trim();
    const safeLastName = String(lastName).trim();

    if (safeFirstName.length < 2 || safeLastName.length < 2) {
      return res.status(400).json({ message: "Nome e apelido devem ter pelo menos 2 caracteres." });
    }

    req.authUser.firstName = safeFirstName;
    req.authUser.lastName = safeLastName;
    req.authUser.email = normalizedEmail;

    const previousAvatarUrl = req.authUser.avatarUrl || null;

    if (req.authUser.role === "admin") {
      const publicPhoneRaw = String(req.body?.publicPhone || "").trim();
      const licenseNumberRaw = String(req.body?.licenseNumber || "").trim();
      const removeAvatar = parseBooleanLike(req.body?.removeAvatar);

      if (publicPhoneRaw && publicPhoneRaw.length > 25) {
        return res.status(400).json({ message: "Contacto publico demasiado longo (maximo 25 caracteres)." });
      }

      if (licenseNumberRaw && licenseNumberRaw.length > 60) {
        return res.status(400).json({ message: "Numero de cedula demasiado longo (maximo 60 caracteres)." });
      }

      req.authUser.publicPhone = publicPhoneRaw || null;
      req.authUser.licenseNumber = licenseNumberRaw || null;

      if (req.file) {
        const uploadedAvatar = await processUserAvatar(req.file, req.authUser.id);
        newAvatarUrl = uploadedAvatar?.imageUrl || null;
      }

      if (newAvatarUrl) {
        req.authUser.avatarUrl = newAvatarUrl;
      } else if (removeAvatar) {
        req.authUser.avatarUrl = null;
      }
    }

    await req.authUser.save();

    if (previousAvatarUrl && previousAvatarUrl !== req.authUser.avatarUrl) {
      await deleteImageByUrl(previousAvatarUrl);
    }

    return res.status(200).json({ user: sanitizeUser(req.authUser) });
  } catch (error) {
    if (newAvatarUrl) {
      await deleteImageByUrl(newAvatarUrl);
    }
    return res.status(500).json({ message: "Erro interno ao atualizar perfil." });
  }
}

async function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Password atual e nova password sao obrigatorias." });
    }

    const currentPasswordOk = await comparePassword(currentPassword, req.authUser.passwordHash);
    if (!currentPasswordOk) {
      return res.status(401).json({ message: "Password atual incorreta." });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ message: "Nova password fraca. Minimo 8 caracteres, com letras e numeros." });
    }

    req.authUser.passwordHash = await hashPassword(newPassword);
    await req.authUser.save();

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Erro interno ao atualizar password." });
  }
}

async function deleteMe(req, res) {
  try {
    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({ message: "Password obrigatoria para eliminar conta." });
    }

    const passwordOk = await comparePassword(password, req.authUser.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ message: "Password incorreta." });
    }

    await req.authUser.destroy({ force: true });
    clearAuthCookie(res);

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Erro interno ao eliminar conta." });
  }
}

async function getMyPropertyStats(req, res) {
  try {
    const properties = await Property.findAll({
      where: {
        ownerId: req.authUser.id,
      },
      attributes: [
        "id",
        "title",
        "price",
        "district",
        "county",
        "parish",
        "rooms",
        "bathrooms",
        "usefulArea",
        "viewsCount",
        "objective",
        "propertyType",
        "status",
        "createdAt",
        [
          sequelize.literal(
            "(SELECT COUNT(*) FROM messages WHERE messages.property_id = Property.id)"
          ),
          "interestedContacts",
        ],
      ],
      include: [
        {
          model: PropertyImage,
          as: "images",
          required: false,
          where: { isMain: true },
          attributes: ["id", "imageUrl", "isMain"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const stats = properties.map((property) => {
      const plain = property.get({ plain: true });
      const interestedContacts = Number.parseInt(plain.interestedContacts || 0, 10);

      return {
        id: plain.id,
        title: plain.title,
        price: plain.price,
        district: plain.district,
        county: plain.county,
        parish: plain.parish,
        rooms: plain.rooms,
        bathrooms: plain.bathrooms,
        usefulArea: plain.usefulArea,
        objective: plain.objective,
        propertyType: plain.propertyType,
        status: plain.status,
        viewsCount: plain.viewsCount,
        mainImage: (plain.images || [])[0] || null,
        interestedContacts,
      };
    });

    const summary = stats.reduce(
      (acc, item) => {
        acc.totalViews += Number(item.viewsCount || 0);
        acc.totalInterestedContacts += Number(item.interestedContacts || 0);
        return acc;
      },
      {
        totalProperties: stats.length,
        totalViews: 0,
        totalInterestedContacts: 0,
      }
    );

    return res.status(200).json({ stats, summary });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao carregar estatisticas de imoveis." });
  }
}

async function forgotPassword(req, res) {
  try {
    await ensurePasswordResetTable();
    await cleanupPasswordResetTokensIfNeeded();

    const email = normalizeEmail(req.body?.email);
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Email invalido." });
    }

    const user = await User.findOne({
      where: {
        email,
        deletedAt: null,
      },
    });

    const genericResponse = {
      message: "Se o email existir, vais receber instrucoes para redefinir a password.",
    };

    if (!user) {
      return res.status(202).json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + auth.passwordResetTokenTtlMinutes * 60 * 1000);

    await sequelize.transaction(async (transaction) => {
      await PasswordResetToken.update(
        { usedAt: new Date() },
        {
          where: {
            userId: user.id,
            usedAt: null,
            expiresAt: {
              [Op.gte]: new Date(),
            },
          },
          transaction,
        }
      );

      await PasswordResetToken.create(
        {
          userId: user.id,
          tokenHash,
          expiresAt,
          usedAt: null,
        },
        { transaction }
      );
    });

    const resetUrl = `${auth.passwordResetUrl}?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail({ user, resetUrl });
    } catch (emailError) {
      // Keep generic response to avoid account enumeration and prevent UX leaks.
    }

    return res.status(202).json(genericResponse);
  } catch (error) {
    return res.status(500).json({ message: "Erro interno ao iniciar recuperacao de password." });
  }
}

async function resetPassword(req, res) {
  try {
    await ensurePasswordResetTable();
    await cleanupPasswordResetTokensIfNeeded();

    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token e nova password sao obrigatorios." });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ message: "Nova password fraca. Minimo 8 caracteres, com letras e numeros." });
    }

    const tokenHash = hashResetToken(token);

    const resetRecord = await PasswordResetToken.findOne({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          [Op.gte]: new Date(),
        },
      },
      order: [["id", "DESC"]],
    });

    if (!resetRecord) {
      return res.status(400).json({ message: "Token invalido ou expirado." });
    }

    const user = await User.findOne({
      where: {
        id: resetRecord.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalido ou expirado." });
    }

    await sequelize.transaction(async (transaction) => {
      user.passwordHash = await hashPassword(newPassword);
      await user.save({ transaction });

      resetRecord.usedAt = new Date();
      await resetRecord.save({ transaction });

      await PasswordResetToken.update(
        { usedAt: new Date() },
        {
          where: {
            userId: user.id,
            usedAt: null,
            id: {
              [Op.ne]: resetRecord.id,
            },
          },
          transaction,
        }
      );
    });

    return res.status(200).json({ message: "Password redefinida com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro interno ao redefinir password." });
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  getMyPropertyStats,
  updateMe,
  updatePassword,
  deleteMe,
  forgotPassword,
  resetPassword,
};
