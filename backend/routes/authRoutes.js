const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth, attachAuthUserIfAvailable } = require("../middlewares/authMiddleware");
const { issueCsrfToken, requireCsrf } = require("../middlewares/csrfProtection");
const { uploadUserAvatar } = require("../middlewares/uploadUserAvatar");
const {
	loginRateLimit,
	forgotPasswordRateLimit,
	resetPasswordRateLimit,
} = require("../middlewares/authRateLimit");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", loginRateLimit, authController.login);
router.post("/logout", requireAuth, requireCsrf, authController.logout);
router.post("/forgot-password", forgotPasswordRateLimit, authController.forgotPassword);
router.post("/reset-password", resetPasswordRateLimit, authController.resetPassword);
router.get("/csrf-token", issueCsrfToken, authController.csrfToken);

router.get("/me", issueCsrfToken, attachAuthUserIfAvailable, authController.me);
router.get("/me/property-stats", requireAuth, authController.getMyPropertyStats);
router.put("/me", requireAuth, requireCsrf, uploadUserAvatar, authController.updateMe);
router.put("/me/password", requireAuth, requireCsrf, authController.updatePassword);
router.delete("/me", requireAuth, requireCsrf, authController.deleteMe);

module.exports = router;
