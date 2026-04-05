const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { Property, PropertyImage, PropertyDivision, User } = require("../models");
const { processUploadedImages, deleteImageByUrl } = require("../services/propertyMediaService");
const {
  parseDivisions,
  parseImageIds,
  parseNullableInt,
  validatePayload,
} = require("../services/propertyPayloadService");

function buildPropertyInclude() {
  return [
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
      as: "owner",
      required: false,
      attributes: ["id", "firstName", "lastName", "email", "role"],
    },
    {
      model: User,
      as: "agent",
      required: false,
      attributes: ["id", "firstName", "lastName", "email", "role", "publicPhone", "licenseNumber", "avatarUrl"],
    },
  ];
}

async function validateOwnerAndAgent({ ownerId, agentId }) {
  if (ownerId !== undefined && ownerId !== null) {
    const owner = await User.findByPk(ownerId);
    if (!owner) {
      return "ownerId nao existe.";
    }
    if (owner.role !== "cliente") {
      return "ownerId tem de pertencer a um cliente.";
    }
  }

  if (agentId !== undefined && agentId !== null) {
    const agent = await User.findByPk(agentId);
    if (!agent) {
      return "agentId nao existe.";
    }
    if (agent.role !== "admin") {
      return "agentId tem de pertencer a um admin.";
    }
  }

  return null;
}

async function ensureMainImage(propertyId, transaction) {
  const images = await PropertyImage.findAll({
    where: { propertyId },
    order: [["id", "ASC"]],
    transaction,
  });

  if (images.length === 0) {
    return;
  }

  const hasMain = images.some((image) => image.isMain);

  if (!hasMain) {
    await PropertyImage.update(
      { isMain: false },
      { where: { propertyId }, transaction }
    );
    await PropertyImage.update(
      { isMain: true },
      { where: { id: images[0].id, propertyId }, transaction }
    );
  }
}

function extractMainImageId(body) {
  const value = parseNullableInt(body.mainImageId);
  return value;
}

function canManageProperty(authUser, property) {
  if (!authUser || authUser.role !== "admin" || !property) {
    return false;
  }

  if (!Number.isInteger(property.agentId)) {
    return true;
  }

  return property.agentId === authUser.id;
}

async function listProperties(req, res) {
  try {
    const properties = await Property.findAll({
      include: buildPropertyInclude(),
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ properties });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao listar imoveis." });
  }
}

async function getPropertyById(req, res) {
  try {
    const propertyId = Number.parseInt(req.params.propertyId, 10);

    if (!Number.isInteger(propertyId)) {
      return res.status(400).json({ message: "propertyId invalido." });
    }

    const property = await Property.findByPk(propertyId, {
      include: buildPropertyInclude(),
      order: [[{ model: PropertyImage, as: "images" }, "id", "ASC"]],
    });

    if (!property) {
      return res.status(404).json({ message: "Imovel nao encontrado." });
    }

    if (!canManageProperty(req.authUser, property)) {
      return res.status(403).json({ message: "Sem permissao para editar este imovel." });
    }

    return res.status(200).json({ property });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao obter imovel." });
  }
}

async function createProperty(req, res) {
  const transaction = await sequelize.transaction();
  const newImageUrls = [];

  try {
    const { parsed, errors } = validatePayload(req.body, { partial: false });

    if (errors.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: errors.join(" ") });
    }

    if (parsed.agentId === undefined || parsed.agentId === null) {
      parsed.agentId = req.authUser.id;
    }

    const relationError = await validateOwnerAndAgent({
      ownerId: parsed.ownerId,
      agentId: parsed.agentId,
    });

    if (relationError) {
      await transaction.rollback();
      return res.status(400).json({ message: relationError });
    }

    const property = await Property.create(parsed, { transaction });

    const divisions = parseDivisions(req.body.divisions);
    if (divisions.length > 0) {
      await PropertyDivision.bulkCreate(
        divisions.map((division) => ({
          propertyId: property.id,
          name: division.name,
          area: division.area,
        })),
        { transaction }
      );
    }

    const uploadedImages = await processUploadedImages(req.files || [], property.id);
    for (const image of uploadedImages) {
      newImageUrls.push(image.imageUrl);
    }

    if (uploadedImages.length > 0) {
      const mainImageIndex = parseNullableInt(req.body.mainImageIndex);
      const safeMainIndex =
        Number.isInteger(mainImageIndex) && mainImageIndex >= 0 && mainImageIndex < uploadedImages.length
          ? mainImageIndex
          : 0;

      await PropertyImage.bulkCreate(
        uploadedImages.map((image, index) => ({
          propertyId: property.id,
          imageUrl: image.imageUrl,
          isMain: index === safeMainIndex,
        })),
        { transaction }
      );
    }

    await transaction.commit();

    const createdProperty = await Property.findByPk(property.id, {
      include: buildPropertyInclude(),
    });

    return res.status(201).json({ property: createdProperty });
  } catch (error) {
    await transaction.rollback();
    for (const imageUrl of newImageUrls) {
      // Best effort cleanup in case DB transaction fails after image processing.
      // eslint-disable-next-line no-await-in-loop
      await deleteImageByUrl(imageUrl);
    }
    return res.status(500).json({ message: "Erro ao criar imovel." });
  }
}

async function updateProperty(req, res) {
  const transaction = await sequelize.transaction();
  const newImageUrls = [];
  const removedImageUrls = [];

  try {
    const propertyId = Number.parseInt(req.params.propertyId, 10);
    if (!Number.isInteger(propertyId)) {
      await transaction.rollback();
      return res.status(400).json({ message: "propertyId invalido." });
    }

    const property = await Property.findByPk(propertyId, { transaction });
    if (!property) {
      await transaction.rollback();
      return res.status(404).json({ message: "Imovel nao encontrado." });
    }

    if (!canManageProperty(req.authUser, property)) {
      await transaction.rollback();
      return res.status(403).json({ message: "Sem permissao para editar este imovel." });
    }

    const { parsed, errors } = validatePayload(req.body, { partial: true });
    if (errors.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: errors.join(" ") });
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => value !== undefined)
    );

    if (updateData.agentId !== undefined && updateData.agentId === null) {
      updateData.agentId = req.authUser.id;
    }

    const relationError = await validateOwnerAndAgent({
      ownerId: updateData.ownerId,
      agentId: updateData.agentId,
    });

    if (relationError) {
      await transaction.rollback();
      return res.status(400).json({ message: relationError });
    }

    if (Object.keys(updateData).length > 0) {
      await property.update(updateData, { transaction });
    }

    const removeImageIds = parseImageIds(req.body.removeImageIds);
    if (removeImageIds.length > 0) {
      const imagesToDelete = await PropertyImage.findAll({
        where: {
          id: {
            [Op.in]: removeImageIds,
          },
          propertyId,
        },
        transaction,
      });

      await PropertyImage.destroy({
        where: {
          id: {
            [Op.in]: imagesToDelete.map((image) => image.id),
          },
          propertyId,
        },
        transaction,
      });

      for (const image of imagesToDelete) {
        removedImageUrls.push(image.imageUrl);
      }
    }

    const uploadedImages = await processUploadedImages(req.files || [], propertyId);
    for (const image of uploadedImages) {
      newImageUrls.push(image.imageUrl);
    }

    if (uploadedImages.length > 0) {
      await PropertyImage.bulkCreate(
        uploadedImages.map((image) => ({
          propertyId,
          imageUrl: image.imageUrl,
          isMain: false,
        })),
        { transaction }
      );
    }

    if (req.body.divisions !== undefined) {
      const divisions = parseDivisions(req.body.divisions);
      await PropertyDivision.destroy({ where: { propertyId }, transaction });
      if (divisions.length > 0) {
        await PropertyDivision.bulkCreate(
          divisions.map((division) => ({
            propertyId,
            name: division.name,
            area: division.area,
          })),
          { transaction }
        );
      }
    }

    const mainImageId = extractMainImageId(req.body);
    if (mainImageId !== null) {
      const imageExists = await PropertyImage.findOne({
        where: { id: mainImageId, propertyId },
        transaction,
      });

      if (!imageExists) {
        await transaction.rollback();
        return res.status(400).json({ message: "mainImageId nao pertence ao imovel." });
      }

      await PropertyImage.update({ isMain: false }, { where: { propertyId }, transaction });
      await PropertyImage.update(
        { isMain: true },
        { where: { id: mainImageId, propertyId }, transaction }
      );
    }

    await ensureMainImage(propertyId, transaction);
    await transaction.commit();

    for (const imageUrl of removedImageUrls) {
      // eslint-disable-next-line no-await-in-loop
      await deleteImageByUrl(imageUrl);
    }

    const updatedProperty = await Property.findByPk(propertyId, {
      include: buildPropertyInclude(),
    });

    return res.status(200).json({ property: updatedProperty });
  } catch (error) {
    await transaction.rollback();
    for (const imageUrl of newImageUrls) {
      // eslint-disable-next-line no-await-in-loop
      await deleteImageByUrl(imageUrl);
    }
    return res.status(500).json({ message: "Erro ao atualizar imovel." });
  }
}

async function deleteProperty(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const propertyId = Number.parseInt(req.params.propertyId, 10);
    if (!Number.isInteger(propertyId)) {
      await transaction.rollback();
      return res.status(400).json({ message: "propertyId invalido." });
    }

    const property = await Property.findByPk(propertyId, {
      include: [
        {
          model: PropertyImage,
          as: "images",
          required: false,
          attributes: ["id", "imageUrl"],
        },
      ],
      transaction,
    });

    if (!property) {
      await transaction.rollback();
      return res.status(404).json({ message: "Imovel nao encontrado." });
    }

    const imageUrls = property.images.map((image) => image.imageUrl);

    await PropertyImage.destroy({ where: { propertyId }, transaction });
    await PropertyDivision.destroy({ where: { propertyId }, transaction });
    await property.destroy({ transaction });

    await transaction.commit();

    for (const imageUrl of imageUrls) {
      // eslint-disable-next-line no-await-in-loop
      await deleteImageByUrl(imageUrl);
    }

    return res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: "Erro ao eliminar imovel." });
  }
}

module.exports = {
  listProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
};
