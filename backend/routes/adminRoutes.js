const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const { requireCsrf } = require("../middlewares/csrfProtection");
const adminUsersController = require("../controllers/adminUsersController");
const adminPropertyRoutes = require("./adminPropertyRoutes");
const adminMessageRoutes = require("./adminMessageRoutes");

const router = express.Router();

router.use(requireAuth, requireCsrf);

router.get("/users", requireRole("admin", "colaborador"), adminUsersController.listUsers);
router.post("/users/admin", requireRole("admin"), adminUsersController.createAdmin);
router.use("/properties", requireRole("admin", "colaborador"), adminPropertyRoutes);
router.use("/messages", requireRole("admin"), adminMessageRoutes);

module.exports = router;
