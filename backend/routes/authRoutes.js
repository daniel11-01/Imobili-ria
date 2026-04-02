const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middlewares/authMiddleware");
const {
	loginRateLimit,
	forgotPasswordRateLimit,
	resetPasswordRateLimit,
} = require("../middlewares/authRateLimit");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", loginRateLimit, authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", forgotPasswordRateLimit, authController.forgotPassword);
router.post("/reset-password", resetPasswordRateLimit, authController.resetPassword);

router.get("/me", requireAuth, authController.me);
router.get("/me/property-stats", requireAuth, authController.getMyPropertyStats);
router.put("/me", requireAuth, authController.updateMe);
router.put("/me/password", requireAuth, authController.updatePassword);
router.delete("/me", requireAuth, authController.deleteMe);

module.exports = router;
