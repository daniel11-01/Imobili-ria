const multer = require("multer");

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 12,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Formato de imagem invalido. Usa JPG, PNG ou WEBP."));
      return;
    }
    cb(null, true);
  },
});

function uploadPropertyImages(req, res, next) {
  const middleware = upload.array("images", 12);
  middleware(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    res.status(400).json({
      message: error.message || "Falha no upload de imagens.",
    });
  });
}

module.exports = {
  uploadPropertyImages,
};
