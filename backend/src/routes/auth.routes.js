import express from "express";
import { login, logout, signup,updateProfile } from "../controllers/auth.controller";
import { verfiyJwt } from "../middlewares/authLogin.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = express.Router();


router.route("/signup").post(signup);

router.route("/login").post(login);

router.route("/logout").post(logout);

router.route("/me").get();

router.route("/update-profile").put(verfiyJwt,upload.single("profilePic"), updateProfile);

export default router;