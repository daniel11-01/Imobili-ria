const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const { requireCsrf } = require("../middlewares/csrfProtection");
const adminUsersController = require("../controllers/adminUsersController");
const adminPropertyRoutes = require("./adminPropertyRoutes");
const adminMessageRoutes = require("./adminMessageRoutes");

const router = express.Router();

router.use(requireAuth, requireRole("admin"), requireCsrf);

router.get("/users", adminUsersController.listUsers);
router.post("/users/admin", adminUsersController.createAdmin);
router.use("/properties", adminPropertyRoutes);
router.use("/messages", adminMessageRoutes);

module.exports = router;
