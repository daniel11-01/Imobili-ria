const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const uploadsDir = path.resolve(__dirname, "../public/uploads");
const propertyUploadsDir = path.join(uploadsDir, "properties");
const avatarUploadsDir = path.join(uploadsDir, "agents");

async function ensureUploadsDir() {
  await fs.mkdir(propertyUploadsDir, { recursive: true });
  await fs.mkdir(avatarUploadsDir, { recursive: true });
}

function buildImageFilename(propertyId, index) {
  const now = Date.now();
  return `property_${propertyId}_${now}_${index}.webp`;
}

function buildAvatarFilename(userId) {
  const now = Date.now();
  return `agent_${userId}_${now}.webp`;
}

function toImageUrl(folder, filename) {
  return `/uploads/${folder}/${filename}`;
}

function sanitizeStoredPath(imageUrl) {
  const raw = String(imageUrl || "").trim();
  if (!raw) {
    return "";
  }

  // Accept both absolute and relative URLs and normalize to a path under /uploads.
  const withoutOrigin = raw.replace(/^https?:\/\/[^/]+/i, "");
  return withoutOrigin.replace(/^\/+/, "");
}

async function processUploadedImages(files, propertyId) {
  await ensureUploadsDir();

  if (!files || files.length === 0) {
    return [];
  }

  const processed = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const filename = buildImageFilename(propertyId, index + 1);
    const outputPath = path.join(propertyUploadsDir, filename);

    await sharp(file.buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(outputPath);

    processed.push({
      imageUrl: toImageUrl("properties", filename),
    });
  }

  return processed;
}

async function processUserAvatar(file, userId) {
  await ensureUploadsDir();

  if (!file) {
    return null;
  }

  const filename = buildAvatarFilename(userId);
  const outputPath = path.join(avatarUploadsDir, filename);

  await sharp(file.buffer)
    .rotate()
    .resize({
      width: 720,
      height: 720,
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 86 })
    .toFile(outputPath);

  return {
    imageUrl: toImageUrl("agents", filename),
  };
}

async function deleteImageByUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    return;
  }

  const normalized = sanitizeStoredPath(imageUrl);
  if (!normalized.startsWith("uploads/")) {
    return;
  }

  const relativePath = normalized.replace(/^uploads\//, "");
  const absolutePath = path.join(uploadsDir, relativePath);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

module.exports = {
  processUploadedImages,
  processUserAvatar,
  deleteImageByUrl,
};
