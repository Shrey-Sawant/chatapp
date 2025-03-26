import express from "express";
import { login, logout, signup, updateProfile, checkAuth } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/authLogin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();


router.route("/signup").post(signup);

router.route("/login").post(login);

router.route("/logout").post(logout);

router.route("/me").get();

router.route("/update-profile").put(verifyJWT, upload.single("profilePic"), updateProfile);

router.route("/check").get(verifyJWT, checkAuth);

export default router;