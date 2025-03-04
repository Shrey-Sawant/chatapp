import express from 'express';
import { verfiyJwt } from '../middlewares/authLogin.middleware';
import { getUserForSideBar,getMessages,sendMessage } from '../controllers/message.controller';

const router=express.Router();

router.route('/users').get(verfiyJwt,getUserForSideBar);
router.route('/:id').get(verfiyJwt,getMessages);
router.route('/send/:id').post(verfiyJwt,upload.array("pictures",30),sendMessage);

export default router;