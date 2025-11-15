import express from "express";
import {
  register,
  login,
  getProfile,
  sendOtp,
  resetPasswordWithOtp,
  updatePushToken,
  updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../config/multerConfig.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/push-token", protect, updatePushToken);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, upload.single('profileImage'), updateProfile);

router.post("/send-otp", sendOtp);
router.post("/reset-password-otp", resetPasswordWithOtp);

export default router;