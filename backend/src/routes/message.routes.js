import express from 'express';
import { verifyJWT } from '../middlewares/authLogin.middleware.js';
import { getUserForSideBar, getMessages, sendMessage } from '../controllers/message.controller.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.route('/users').get(verifyJWT, getUserForSideBar);
router.route('/:id').get(verifyJWT, getMessages);
router.route('/send/:id').post(verifyJWT, upload.fields([{ name: "pictures", maxCount: 30 }]), sendMessage);

export default router;