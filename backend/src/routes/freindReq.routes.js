import express from "express";
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getPendingRequests,
  searchGlobalUsers,
  searchUsers,
} from "../controllers/friendRequest.controller.js";  
import { verifyJWT } from "../middlewares/authLogin.middleware.js";

const router = express.Router();

router.get("/requests",verifyJWT, getPendingRequests);
router.post("/reject/:userId",verifyJWT, rejectRequest);
router.post("/request/:userId",verifyJWT, sendRequest);
router.post("/accept/:userId",verifyJWT, acceptRequest);
router.get("/global-users",verifyJWT, searchGlobalUsers);
router.get("/search",verifyJWT, searchUsers);

export default router;
