const multer = require("multer");

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Formato de avatar invalido. Usa JPG, PNG ou WEBP."));
      return;
    }

    cb(null, true);
  },
});

function uploadUserAvatar(req, res, next) {
  const middleware = upload.single("avatar");

  middleware(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    res.status(400).json({
      message: error.message || "Falha no upload do avatar.",
    });
  });
}

module.exports = {
  uploadUserAvatar,
};
