const express = require("express");
const adminPropertiesController = require("../controllers/adminPropertiesController");
const { uploadPropertyImages } = require("../middlewares/uploadPropertyImages");

const router = express.Router();

router.get("/", adminPropertiesController.listProperties);
router.get("/:propertyId", adminPropertiesController.getPropertyById);
router.post("/", uploadPropertyImages, adminPropertiesController.createProperty);
router.put("/:propertyId", uploadPropertyImages, adminPropertiesController.updateProperty);
router.delete("/:propertyId", adminPropertiesController.deleteProperty);

module.exports = router;
