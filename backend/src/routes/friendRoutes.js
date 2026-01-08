import express from "express";
import { verifyToken } from "../middlewares/auth.js";
import {
    sendFriendRequest,
    getIncomingRequests,
    getOutgoingRequests,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    listFriends,
    unfriend,
    getRelationshipStatus,
} from "../controllers/friendController.js";

const router = express.Router();

router.use(verifyToken);

router.get("/requests/incoming", getIncomingRequests);
router.get("/requests/outgoing", getOutgoingRequests);
router.post("/requests/:requestId/accept", acceptFriendRequest);
router.post("/requests/:requestId/decline", declineFriendRequest);
router.delete("/requests/:requestId", cancelFriendRequest);
router.post("/requests/:userId", sendFriendRequest);

router.get("/list", listFriends);
router.delete("/:friendUserId", unfriend);

router.get("/status/:userId", getRelationshipStatus);

export default router;
