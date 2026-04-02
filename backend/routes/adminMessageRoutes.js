const express = require("express");
const adminMessagesController = require("../controllers/adminMessagesController");

const router = express.Router();

router.get("/", adminMessagesController.listMessages);
router.patch("/:messageId/read", adminMessagesController.updateMessageReadStatus);

module.exports = router;
