const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { storage } = require("../config/env");

const uploadsDir = storage.uploadsRoot;
const uploadsPublicPath = String(storage.uploadsPublicPath || "/uploads").replace(/\/+$/, "");
const uploadsPublicBaseUrl = String(storage.uploadsPublicBaseUrl || "").replace(/\/+$/, "");
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
  const relativeUrl = `${uploadsPublicPath}/${folder}/${filename}`;
  return uploadsPublicBaseUrl ? `${uploadsPublicBaseUrl}${relativeUrl}` : relativeUrl;
}

function sanitizeStoredPath(imageUrl) {
  const raw = String(imageUrl || "").trim();
  if (!raw) {
    return "";
  }

  let pathname = raw;

  if (/^https?:\/\//i.test(raw)) {
    try {
      pathname = new URL(raw).pathname || "";
    } catch (error) {
      return "";
    }
  } else {
    pathname = raw.split(/[?#]/, 1)[0] || "";
  }

  const normalizedPath = `/${String(pathname).replace(/^\/+/, "")}`;
  const prefix = uploadsPublicPath || "/uploads";
  const expectedPrefix = `${prefix}/`;

  if (!normalizedPath.startsWith(expectedPrefix)) {
    return "";
  }

  return normalizedPath.slice(expectedPrefix.length);
}

function resolveSafeUploadPath(relativePath) {
  const cleanRelativePath = String(relativePath || "").replace(/^\/+/, "");
  if (!cleanRelativePath) {
    return "";
  }

  const root = path.resolve(uploadsDir);
  const absolutePath = path.resolve(root, cleanRelativePath);

  if (absolutePath === root || !absolutePath.startsWith(`${root}${path.sep}`)) {
    return "";
  }

  return absolutePath;
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

  const relativePath = sanitizeStoredPath(imageUrl);
  if (!relativePath) {
    return;
  }

  const absolutePath = resolveSafeUploadPath(relativePath);
  if (!absolutePath) {
    return;
  }

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
