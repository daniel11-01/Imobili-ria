const { Op } = require("sequelize");
const { Property, PropertyImage, PropertyDivision, User } = require("../models");

const VIEW_INCREMENT_WINDOW_MS = 30 * 60 * 1000;
const viewIncrementThrottle = new Map();

function toInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toFloat(value, fallback = null) {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseBooleanQuery(value) {
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

function parseIntegerList(value) {
  if (!value || typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => toInt(item.trim(), null))
    .filter((item) => Number.isInteger(item));
}

function parseStringList(value) {
  if (!value || typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeSearchTerm(value, { minLength = 2, maxLength = 60 } = {}) {
  if (typeof value !== "string") {
    return "";
  }

  const compact = value.trim().replace(/[\r\n\t]/g, " ").replace(/[%_]/g, "");
  if (compact.length < minLength) {
    return "";
  }

  return compact.slice(0, maxLength);
}

function buildPrefixLike(term) {
  if (!term) {
    return null;
  }

  return {
    [Op.like]: `${term}%`,
  };
}

function buildSorting(sortBy) {
  switch (sortBy) {
    case "price_asc":
      return [["price", "ASC"]];
    case "price_desc":
      return [["price", "DESC"]];
    case "area_desc":
      return [["usefulArea", "DESC"]];
    default:
      return [["createdAt", "DESC"]];
  }
}

function buildListFilters(query) {
  const where = {};

  if (query.objective) {
    where.objective = query.objective;
  }

  if (query.propertyType) {
    where.propertyType = query.propertyType;
  }

  if (query.status) {
    where.status = query.status;
  }

  const priceMin = toFloat(query.priceMin);
  const priceMax = toFloat(query.priceMax);
  if (priceMin !== null || priceMax !== null) {
    where.price = {};
    if (priceMin !== null) {
      where.price[Op.gte] = priceMin;
    }
    if (priceMax !== null) {
      where.price[Op.lte] = priceMax;
    }
  }

  const usefulAreaMin = toFloat(query.usefulAreaMin);
  const usefulAreaMax = toFloat(query.usefulAreaMax);
  if (usefulAreaMin !== null || usefulAreaMax !== null) {
    where.usefulArea = {};
    if (usefulAreaMin !== null) {
      where.usefulArea[Op.gte] = usefulAreaMin;
    }
    if (usefulAreaMax !== null) {
      where.usefulArea[Op.lte] = usefulAreaMax;
    }
  }

  const rooms = parseIntegerList(query.rooms);
  if (rooms.length > 0) {
    const includesFivePlus = rooms.includes(5);
    const fixedRooms = rooms.filter((room) => room < 5);

    if (includesFivePlus && fixedRooms.length > 0) {
      where[Op.or] = [{ rooms: { [Op.in]: fixedRooms } }, { rooms: { [Op.gte]: 5 } }];
    } else if (includesFivePlus) {
      where.rooms = { [Op.gte]: 5 };
    } else {
      where.rooms = { [Op.in]: fixedRooms };
    }
  }

  const bathroomsMin = toInt(query.bathroomsMin, null);
  if (bathroomsMin !== null) {
    where.bathrooms = { [Op.gte]: bathroomsMin };
  }

  const elevator = parseBooleanQuery(query.elevator);
  if (elevator !== null) {
    where.elevator = elevator;
  }

  const evCharging = parseBooleanQuery(query.evCharging);
  if (evCharging !== null) {
    where.evCharging = evCharging;
  }

  const hasParking = parseBooleanQuery(query.hasParking);
  if (hasParking === true) {
    where.parkingSpaces = { [Op.gt]: 0 };
  }

  const energyCertList = parseStringList(query.energyCert);
  if (energyCertList.length > 0) {
    where.energyCert = { [Op.in]: energyCertList };
  }

  const district = sanitizeSearchTerm(query.district, { minLength: 1, maxLength: 50 });
  const county = sanitizeSearchTerm(query.county, { minLength: 1, maxLength: 50 });
  const parish = sanitizeSearchTerm(query.parish, { minLength: 1, maxLength: 50 });
  const location = sanitizeSearchTerm(query.location, { minLength: 2, maxLength: 60 });

  if (district) {
    where.district = buildPrefixLike(district);
  }

  if (county) {
    where.county = buildPrefixLike(county);
  }

  if (parish) {
    where.parish = buildPrefixLike(parish);
  }

  if (location) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          [Op.or]: [
            { district: buildPrefixLike(location) },
            { county: buildPrefixLike(location) },
            { parish: buildPrefixLike(location) },
          ],
        },
      ];
  }

  return where;
}

function shouldIncrementView(req, propertyId) {
  const ip = String(req.ip || req.headers["x-forwarded-for"] || "").trim();
  const userAgent = String(req.headers["user-agent"] || "").trim().slice(0, 140);
  const key = `${propertyId}:${ip}:${userAgent}`;
  const now = Date.now();
  const lastHitAt = viewIncrementThrottle.get(key) || 0;

  if (now - lastHitAt < VIEW_INCREMENT_WINDOW_MS) {
    return false;
  }

  viewIncrementThrottle.set(key, now);

  if (viewIncrementThrottle.size > 10000) {
    for (const [entryKey, timestamp] of viewIncrementThrottle.entries()) {
      if (now - timestamp > VIEW_INCREMENT_WINDOW_MS) {
        viewIncrementThrottle.delete(entryKey);
      }
    }
  }

  return true;
}

function canSeeViewsCount(authUser, propertyLike) {
  if (!authUser || !propertyLike) {
    return false;
  }

  if (authUser.role === "admin") {
    return true;
  }

  return authUser.id === propertyLike.ownerId || authUser.id === propertyLike.agentId;
}

function canEditProperty(authUser, propertyLike) {
  if (!authUser || !propertyLike) {
    return false;
  }

  if (authUser.role !== "admin") {
    return false;
  }

  return authUser.id === propertyLike.agentId;
}

function serializePropertyForList(property, authUser) {
  const plain = property.get({ plain: true });
  const mainImage = (plain.images || [])[0] || null;
  const includeViewsCount = canSeeViewsCount(authUser, plain);
  const canEdit = canEditProperty(authUser, plain);

  return {
    id: plain.id,
    title: plain.title,
    objective: plain.objective,
    propertyType: plain.propertyType,
    status: plain.status,
    price: plain.price,
    district: plain.district,
    county: plain.county,
    parish: plain.parish,
    rooms: plain.rooms,
    bathrooms: plain.bathrooms,
    usefulArea: plain.usefulArea,
    energyCert: plain.energyCert,
    createdAt: plain.createdAt,
    mainImage,
    agent: plain.agent,
    canEdit,
    ...(includeViewsCount ? { viewsCount: plain.viewsCount } : {}),
  };
}

async function listPublicProperties(req, res) {
  try {
    const page = Math.max(toInt(req.query.page, 1), 1);
    const pageSize = Math.min(Math.max(toInt(req.query.pageSize, 12), 1), 48);
    const offset = (page - 1) * pageSize;
    const sortBy = String(req.query.sortBy || "recent").trim();

    const where = buildListFilters(req.query);

    const result = await Property.findAndCountAll({
      where,
      include: [
        {
          model: PropertyImage,
          as: "images",
          attributes: ["id", "imageUrl", "isMain"],
          where: { isMain: true },
          required: false,
        },
        {
          model: User,
          as: "agent",
          required: false,
          attributes: ["id", "firstName", "lastName", "role", "publicPhone", "licenseNumber", "avatarUrl"],
        },
      ],
      order: buildSorting(sortBy),
      offset,
      limit: pageSize,
      distinct: true,
    });

    const properties = result.rows.map((property) => serializePropertyForList(property, req.authUser));
    const total = result.count;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return res.status(200).json({
      properties,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao listar imoveis publicos." });
  }
}

async function getPublicPropertyById(req, res) {
  try {
    const propertyId = toInt(req.params.propertyId, null);

    if (!propertyId) {
      return res.status(400).json({ message: "propertyId invalido." });
    }

    const property = await Property.findByPk(propertyId, {
      include: [
        {
          model: PropertyImage,
          as: "images",
          required: false,
          attributes: ["id", "imageUrl", "isMain"],
        },
        {
          model: PropertyDivision,
          as: "divisions",
          required: false,
          attributes: ["id", "name", "area"],
        },
        {
          model: User,
          as: "agent",
          required: false,
          attributes: ["id", "firstName", "lastName", "role", "publicPhone", "licenseNumber", "avatarUrl"],
        },
      ],
    });

    if (!property) {
      return res.status(404).json({ message: "Imovel nao encontrado." });
    }

    if (shouldIncrementView(req, propertyId)) {
      await property.increment("viewsCount", { by: 1 });
    }

    await property.reload({
      include: [
        {
          model: PropertyImage,
          as: "images",
          required: false,
          attributes: ["id", "imageUrl", "isMain"],
        },
        {
          model: PropertyDivision,
          as: "divisions",
          required: false,
          attributes: ["id", "name", "area"],
        },
        {
          model: User,
          as: "agent",
          required: false,
          attributes: ["id", "firstName", "lastName", "role", "publicPhone", "licenseNumber", "avatarUrl"],
        },
      ],
    });

    const plain = property.get({ plain: true });
    plain.images = (plain.images || []).sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.id - b.id);
    plain.canEdit = canEditProperty(req.authUser, plain);

    if (!canSeeViewsCount(req.authUser, plain)) {
      delete plain.viewsCount;
    }

    return res.status(200).json({ property: plain });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao obter detalhe do imovel." });
  }
}

module.exports = {
  listPublicProperties,
  getPublicPropertyById,
};
