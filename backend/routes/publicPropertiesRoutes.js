const express = require("express");
const publicPropertiesController = require("../controllers/publicPropertiesController");
const publicContactController = require("../controllers/publicContactController");
const { attachAuthUserIfAvailable } = require("../middlewares/authMiddleware");
const { contactRateLimit } = require("../middlewares/contactRateLimit");

const router = express.Router();

router.get("/", attachAuthUserIfAvailable, publicPropertiesController.listPublicProperties);
router.post(
	"/:propertyId/contact",
	contactRateLimit,
	attachAuthUserIfAvailable,
	publicContactController.sendPropertyContact
);
router.get("/:propertyId", attachAuthUserIfAvailable, publicPropertiesController.getPublicPropertyById);

module.exports = router;
