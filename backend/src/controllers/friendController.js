import mongoose from "mongoose";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Friendship from "../models/Friendship.js";

const USER_SUMMARY_FIELDS = "_id first_name last_name login_name";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePagination(req) {
    const limit = Math.min(
        MAX_LIMIT,
        Math.max(1, Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT)
    );
    const skip = Math.max(0, Number.parseInt(req.query.skip, 10) || 0);
    return { limit, skip };
}

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function isSameId(a, b) {
    return String(a) === String(b);
}

function canonicalPair(a, b) {
    const [first, second] = [String(a), String(b)].sort();
    return [new mongoose.Types.ObjectId(first), new mongoose.Types.ObjectId(second)];
}

function pairKeyForIds(a, b) {
    const [first, second] = [String(a), String(b)].sort();
    return `${first}:${second}`;
}

async function ensureUserExists(userId, res) {
    const exists = await User.exists({ _id: userId });
    if (!exists) {
        res.status(404).json({ error: "User not found" });
        return false;
    }
    return true;
}

export async function sendFriendRequest(req, res) {
    try {
        const meId = req.user?._id;
        const targetId = req.params.userId;

        if (!isValidObjectId(targetId)) {
            return res.status(400).json({ error: "Invalid user id" });
        }
        if (isSameId(meId, targetId)) {
            return res.status(400).json({ error: "Cannot send request to yourself" });
        }
        if (!(await ensureUserExists(targetId, res))) return;

        const pair = canonicalPair(meId, targetId);
        const pairKey = pairKeyForIds(meId, targetId);
        const existingFriendship = await Friendship.findOne({
            $or: [{ pairKey }, { users: pair }],
        }).lean();
        if (existingFriendship) {
            return res.status(409).json({ error: "Already friends" });
        }

        const existingRequest = await FriendRequest.findOne({
            status: "PENDING",
            $or: [
                { from: meId, to: targetId },
                { from: targetId, to: meId },
            ],
        }).lean();

        if (existingRequest) {
            if (isSameId(existingRequest.from, meId)) {
                return res.status(200).json({
                    message: "Request already sent",
                    requestId: existingRequest._id,
                });
            }
            return res.status(409).json({
                error: "Incoming request already exists",
                requestId: existingRequest._id,
            });
        }

        const created = await FriendRequest.create({
            from: meId,
            to: targetId,
            status: "PENDING",
        });

        return res.status(201).json({
            message: "Request sent",
            requestId: created._id,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(200).json({ message: "Request already sent" });
        }
        console.error("sendFriendRequest error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function getIncomingRequests(req, res) {
    try {
        const meId = req.user?._id;
        const { limit, skip } = parsePagination(req);

        const [items, total] = await Promise.all([
            FriendRequest.find({ to: meId, status: "PENDING" })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("from", USER_SUMMARY_FIELDS)
                .lean(),
            FriendRequest.countDocuments({ to: meId, status: "PENDING" }),
        ]);

        return res.status(200).json({
            items: items.map((reqItem) => ({
                _id: reqItem._id,
                from: reqItem.from,
                createdAt: reqItem.createdAt,
            })),
            total,
            limit,
            skip,
        });
    } catch (error) {
        console.error("getIncomingRequests error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function getOutgoingRequests(req, res) {
    try {
        const meId = req.user?._id;
        const { limit, skip } = parsePagination(req);

        const [items, total] = await Promise.all([
            FriendRequest.find({ from: meId, status: "PENDING" })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("to", USER_SUMMARY_FIELDS)
                .lean(),
            FriendRequest.countDocuments({ from: meId, status: "PENDING" }),
        ]);

        return res.status(200).json({
            items: items.map((reqItem) => ({
                _id: reqItem._id,
                to: reqItem.to,
                createdAt: reqItem.createdAt,
            })),
            total,
            limit,
            skip,
        });
    } catch (error) {
        console.error("getOutgoingRequests error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function acceptFriendRequest(req, res) {
    try {
        const meId = req.user?._id;
        const requestId = req.params.requestId;

        if (!isValidObjectId(requestId)) {
            return res.status(400).json({ error: "Invalid request id" });
        }

        const request = await FriendRequest.findOne({
            _id: requestId,
            status: "PENDING",
        }).lean();

        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }
        if (!isSameId(request.to, meId)) {
            return res.status(403).json({ error: "Not allowed" });
        }

        const pair = canonicalPair(request.from, request.to);
        const pairKey = pairKeyForIds(request.from, request.to);
        let friendship = await Friendship.findOneAndUpdate(
            { pairKey },
            { $setOnInsert: { users: pair, pairKey } },
            { upsert: true, new: true }
        ).lean();

        if (!friendship) {
            friendship = await Friendship.findOne({ pairKey }).lean();
        }

        await FriendRequest.deleteMany({
            $or: [
                { from: request.from, to: request.to },
                { from: request.to, to: request.from },
            ],
        });

        console.info("acceptFriendRequest", {
            requestId,
            meId: String(meId),
            from: String(request.from),
            to: String(request.to),
            friendshipId: friendship?._id ? String(friendship._id) : null,
        });

        return res.status(200).json({ message: "Accepted" });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(200).json({ message: "Already friends" });
        }
        console.error("acceptFriendRequest error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function declineFriendRequest(req, res) {
    try {
        const meId = req.user?._id;
        const requestId = req.params.requestId;

        if (!isValidObjectId(requestId)) {
            return res.status(400).json({ error: "Invalid request id" });
        }

        const request = await FriendRequest.findOne({
            _id: requestId,
            status: "PENDING",
        }).lean();

        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }
        if (!isSameId(request.to, meId)) {
            return res.status(403).json({ error: "Not allowed" });
        }

        await FriendRequest.deleteOne({ _id: requestId });
        return res.status(200).json({ message: "Declined" });
    } catch (error) {
        console.error("declineFriendRequest error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function cancelFriendRequest(req, res) {
    try {
        const meId = req.user?._id;
        const requestId = req.params.requestId;

        if (!isValidObjectId(requestId)) {
            return res.status(400).json({ error: "Invalid request id" });
        }

        const request = await FriendRequest.findOne({
            _id: requestId,
            status: "PENDING",
        }).lean();

        if (!request) {
            return res.status(200).json({ message: "Already canceled" });
        }
        if (!isSameId(request.from, meId)) {
            return res.status(403).json({ error: "Not allowed" });
        }

        await FriendRequest.deleteOne({ _id: requestId });
        return res.status(200).json({ message: "Canceled" });
    } catch (error) {
        console.error("cancelFriendRequest error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function listFriends(req, res) {
    try {
        const meId = req.user?._id;
        const { limit, skip } = parsePagination(req);

        const [items, total] = await Promise.all([
            Friendship.find({ users: meId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("users", USER_SUMMARY_FIELDS)
                .lean(),
            Friendship.countDocuments({ users: meId }),
        ]);

        const friends = items
            .map((friendship) =>
                (friendship.users || []).find((u) => !isSameId(u._id, meId))
            )
            .filter(Boolean);

        return res.status(200).json({
            items: friends,
            total,
            limit,
            skip,
        });
    } catch (error) {
        console.error("listFriends error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function unfriend(req, res) {
    try {
        const meId = req.user?._id;
        const otherId = req.params.friendUserId;

        if (!isValidObjectId(otherId)) {
            return res.status(400).json({ error: "Invalid user id" });
        }
        if (isSameId(meId, otherId)) {
            return res.status(400).json({ error: "Invalid target" });
        }

        const pair = canonicalPair(meId, otherId);
        const pairKey = pairKeyForIds(meId, otherId);
        await Friendship.deleteOne({ $or: [{ pairKey }, { users: pair }] });
        return res.status(200).json({ message: "Unfriended" });
    } catch (error) {
        console.error("unfriend error:", error);
        return res.status(500).json({ error: error.message });
    }
}

export async function getRelationshipStatus(req, res) {
    try {
        const meId = req.user?._id;
        const otherId = req.params.userId;

        if (!isValidObjectId(otherId)) {
            return res.status(400).json({ error: "Invalid user id" });
        }
        if (isSameId(meId, otherId)) {
            return res.status(200).json({ status: "SELF" });
        }
        if (!(await ensureUserExists(otherId, res))) return;

        const pair = canonicalPair(meId, otherId);
        const pairKey = pairKeyForIds(meId, otherId);
        const friendship = await Friendship.findOne({
            $or: [{ pairKey }, { users: pair }],
        }).lean();
        if (friendship) {
            return res.status(200).json({ status: "FRIENDS" });
        }

        const pending = await FriendRequest.findOne({
            status: "PENDING",
            $or: [
                { from: meId, to: otherId },
                { from: otherId, to: meId },
            ],
        }).lean();

        if (pending) {
            if (isSameId(pending.from, meId)) {
                return res.status(200).json({
                    status: "OUTGOING_PENDING",
                    requestId: pending._id,
                });
            }
            return res.status(200).json({
                status: "INCOMING_PENDING",
                requestId: pending._id,
            });
        }

        return res.status(200).json({ status: "NONE" });
    } catch (error) {
        console.error("getRelationshipStatus error:", error);
        return res.status(500).json({ error: error.message });
    }
}
