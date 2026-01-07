import express from "express";
import {
    getOverview,
    getLeaderboards,
} from "../controllers/adminStatsController.js";

const router = express.Router();

router.get("/overview", getOverview);
router.get("/leaderboards", getLeaderboards);

export default router;
