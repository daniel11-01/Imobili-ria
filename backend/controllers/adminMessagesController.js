const { Op } = require("sequelize");
const { Message, Property, User } = require("../models");

function toInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseBooleanValue(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "sim", "yes"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "nao", "não", "no"].includes(normalized)) {
    return false;
  }

  return null;
}

function parseDateStart(dateValue) {
  if (!dateValue || typeof dateValue !== "string") {
    return null;
  }

  const value = dateValue.trim();
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(dateValue) {
  if (!dateValue || typeof dateValue !== "string") {
    return null;
  }

  const value = dateValue.trim();
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function listMessages(req, res) {
  try {
    const page = Math.max(toInt(req.query.page, 1), 1);
    const pageSize = Math.min(Math.max(toInt(req.query.pageSize, 15), 1), 50);
    const offset = (page - 1) * pageSize;

    const propertyId = toInt(req.query.propertyId, null);
    const isRead = parseBooleanValue(req.query.isRead);
    const dateFrom = parseDateStart(req.query.dateFrom);
    const dateTo = parseDateEnd(req.query.dateTo);

    const messageWhere = {};
    if (isRead !== null) {
      messageWhere.isRead = isRead;
    }

    if (dateFrom || dateTo) {
      messageWhere.createdAt = {};
      if (dateFrom) {
        messageWhere.createdAt[Op.gte] = dateFrom;
      }
      if (dateTo) {
        messageWhere.createdAt[Op.lte] = dateTo;
      }
    }

    const propertyWhere = {
      agentId: req.authUser.id,
    };

    if (propertyId !== null) {
      propertyWhere.id = propertyId;
    }

    const result = await Message.findAndCountAll({
      where: messageWhere,
      include: [
        {
          model: Property,
          as: "property",
          required: true,
          where: propertyWhere,
          attributes: ["id", "title", "objective", "propertyType", "status", "price", "district", "county", "parish", "agentId"],
        },
        {
          model: User,
          as: "sender",
          required: false,
          attributes: ["id", "firstName", "lastName", "email", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: pageSize,
      distinct: true,
    });

    const total = result.count;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return res.status(200).json({
      messages: result.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      filters: {
        propertyId,
        isRead,
        dateFrom: req.query.dateFrom || "",
        dateTo: req.query.dateTo || "",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao listar mensagens do admin." });
  }
}

async function updateMessageReadStatus(req, res) {
  try {
    const messageId = toInt(req.params.messageId, null);
    if (!messageId) {
      return res.status(400).json({ message: "messageId invalido." });
    }

    const isRead = parseBooleanValue(req.body?.isRead);
    if (isRead === null) {
      return res.status(400).json({ message: "isRead deve ser true ou false." });
    }

    const message = await Message.findOne({
      where: { id: messageId },
      include: [
        {
          model: Property,
          as: "property",
          required: true,
          where: {
            agentId: req.authUser.id,
          },
          attributes: ["id", "title", "agentId"],
        },
      ],
    });

    if (!message) {
      return res.status(404).json({ message: "Mensagem nao encontrada." });
    }

    await message.update({ isRead });

    return res.status(200).json({
      message: {
        id: message.id,
        isRead: message.isRead,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao atualizar estado da mensagem." });
  }
}

module.exports = {
  listMessages,
  updateMessageReadStatus,
};
