import User from "../models/User.js";
import Photo from "../models/Photo.js";
import Reaction from "../models/Reaction.js";
import Friendship from "../models/Friendship.js";

const TZ = "Asia/Ho_Chi_Minh";

function parseDate(raw, endOfDay = false) {
    if (!raw || typeof raw !== "string") return null;
    const suffix = endOfDay ? "T23:59:59.999+07:00" : "T00:00:00+07:00";
    const parsed = new Date(`${raw}${suffix}`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function parseRange(req, fallbackDays = 30) {
    const rawFrom = req.query.from;
    const rawTo = req.query.to;
    const from = parseDate(rawFrom, false);
    const to = parseDate(rawTo, true);
    if (rawFrom && !from) {
        return { error: "Invalid from date" };
    }
    if (rawTo && !to) {
        return { error: "Invalid to date" };
    }
    const end = to || new Date();
    const start =
        from || new Date(end.getTime() - fallbackDays * 24 * 60 * 60 * 1000);
    if (start > end) {
        return { error: "Invalid range" };
    }
    return { from: start, to: end };
}

function rangeMatch(field, from, to) {
    return { [field]: { $gte: from, $lte: to } };
}

async function countCommentsInRange(from, to) {
    const res = await Photo.aggregate([
        { $unwind: "$comments" },
        { $match: rangeMatch("comments.date_time", from, to) },
        { $count: "count" },
    ]);
    return res[0]?.count || 0;
}

async function totalCommentCount() {
    const res = await Photo.aggregate([
        {
            $project: {
                commentCount: { $size: { $ifNull: ["$comments", []] } },
            },
        },
        { $group: { _id: null, count: { $sum: "$commentCount" } } },
    ]);
    return res[0]?.count || 0;
}

async function reactionCounts(match) {
    const res = await Reaction.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                likeCount: {
                    $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] },
                },
                dislikeCount: {
                    $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] },
                },
            },
        },
    ]);
    return {
        total: res[0]?.total || 0,
        likeCount: res[0]?.likeCount || 0,
        dislikeCount: res[0]?.dislikeCount || 0,
    };
}

export async function getOverview(req, res) {
    try {
        const { from, to, error } = parseRange(req, 30);
        if (error) {
            return res.status(400).json({ error });
        }

        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            totalPhotos,
            totalComments,
            totalFriendships,
            totalReactions,
            rangeUsers,
            rangePhotos,
            rangeComments,
            rangeFriendships,
            rangeReactions,
            newUsers24h,
            newUsers7d,
            newUsers30d,
            newPhotos24h,
            newPhotos7d,
            newPhotos30d,
            newComments24h,
            newComments7d,
            newComments30d,
        ] = await Promise.all([
            User.countDocuments(),
            Photo.countDocuments(),
            totalCommentCount(),
            Friendship.countDocuments(),
            reactionCounts({}),
            User.countDocuments(rangeMatch("createdAt", from, to)),
            Photo.countDocuments(rangeMatch("createdAt", from, to)),
            countCommentsInRange(from, to),
            Friendship.countDocuments(rangeMatch("createdAt", from, to)),
            reactionCounts(rangeMatch("createdAt", from, to)),
            User.countDocuments(rangeMatch("createdAt", last24h, now)),
            User.countDocuments(rangeMatch("createdAt", last7d, now)),
            User.countDocuments(rangeMatch("createdAt", last30d, now)),
            Photo.countDocuments(rangeMatch("createdAt", last24h, now)),
            Photo.countDocuments(rangeMatch("createdAt", last7d, now)),
            Photo.countDocuments(rangeMatch("createdAt", last30d, now)),
            countCommentsInRange(last24h, now),
            countCommentsInRange(last7d, now),
            countCommentsInRange(last30d, now),
        ]);

        return res.status(200).json({
            range: {
                from: from.toISOString(),
                to: to.toISOString(),
            },
            totals: {
                users: totalUsers,
                photos: totalPhotos,
                comments: totalComments,
                friendships: totalFriendships,
                reactions: totalReactions,
            },
            rangeTotals: {
                users: rangeUsers,
                photos: rangePhotos,
                comments: rangeComments,
                friendships: rangeFriendships,
                reactions: rangeReactions,
            },
            newCounts: {
                users: {
                    last24h: newUsers24h,
                    last7d: newUsers7d,
                    last30d: newUsers30d,
                },
                photos: {
                    last24h: newPhotos24h,
                    last7d: newPhotos7d,
                    last30d: newPhotos30d,
                },
                comments: {
                    last24h: newComments24h,
                    last7d: newComments7d,
                    last30d: newComments30d,
                },
            },
        });
    } catch (error) {
        console.error("getOverview error:", error);
        return res.status(500).json({ error: error.message });
    }
}

async function populateUsersWithCounts(items, limit) {
    const sorted = items.sort((a, b) => b.count - a.count).slice(0, limit);
    const ids = sorted.map((i) => i.userId);
    const users = await User.find({ _id: { $in: ids } })
        .select("_id first_name last_name login_name")
        .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    return sorted.map((i) => ({
        user: userMap.get(String(i.userId)) || { _id: i.userId },
        count: i.count,
    }));
}

export async function getLeaderboards(req, res) {
    try {
        const { from, to, error } = parseRange(req, 30);
        if (error) {
            return res.status(400).json({ error });
        }

        const type = req.query.type;
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const items = [];

        if (type === "users_photos") {
            const rows = await Photo.aggregate([
                { $match: rangeMatch("createdAt", from, to) },
                { $group: { _id: "$user_id", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: limit },
            ]);
            const data = await populateUsersWithCounts(
                rows.map((r) => ({ userId: r._id, count: r.count })),
                limit
            );
            return res.status(200).json({ type, items: data });
        }

        if (type === "users_comments") {
            const rows = await Photo.aggregate([
                { $unwind: "$comments" },
                { $match: rangeMatch("comments.date_time", from, to) },
                { $group: { _id: "$comments.user_id", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: limit },
            ]);
            const data = await populateUsersWithCounts(
                rows.map((r) => ({ userId: r._id, count: r.count })),
                limit
            );
            return res.status(200).json({ type, items: data });
        }

        if (type === "users_friends") {
            const rows = await Friendship.aggregate([
                { $unwind: "$users" },
                { $group: { _id: "$users", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: limit },
            ]);
            const data = await populateUsersWithCounts(
                rows.map((r) => ({ userId: r._id, count: r.count })),
                limit
            );
            return res.status(200).json({ type, items: data });
        }

        if (type === "users_reactions_received") {
            const [photoRows, commentRows] = await Promise.all([
                Reaction.aggregate([
                    { $match: { targetType: "Photo", ...rangeMatch("createdAt", from, to) } },
                    { $group: { _id: "$targetId", count: { $sum: 1 } } },
                    {
                        $lookup: {
                            from: "photos",
                            localField: "_id",
                            foreignField: "_id",
                            as: "photo",
                        },
                    },
                    { $unwind: "$photo" },
                    { $group: { _id: "$photo.user_id", count: { $sum: "$count" } } },
                ]),
                Reaction.aggregate([
                    { $match: { targetType: "Comment", ...rangeMatch("createdAt", from, to) } },
                    {
                        $lookup: {
                            from: "photos",
                            let: { commentId: "$targetId" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $in: ["$$commentId", "$comments._id"] },
                                    },
                                },
                                { $project: { comments: 1 } },
                            ],
                            as: "photo",
                        },
                    },
                    { $unwind: "$photo" },
                    {
                        $project: {
                            comment: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$photo.comments",
                                            as: "c",
                                            cond: { $eq: ["$$c._id", "$targetId"] },
                                        },
                                    },
                                    0,
                                ],
                            },
                        },
                    },
                    { $match: { "comment.user_id": { $exists: true } } },
                    { $group: { _id: "$comment.user_id", count: { $sum: 1 } } },
                ]),
            ]);

            const merged = new Map();
            photoRows.forEach((r) => merged.set(String(r._id), r.count));
            commentRows.forEach((r) => {
                const key = String(r._id);
                merged.set(key, (merged.get(key) || 0) + r.count);
            });

            const data = await populateUsersWithCounts(
                Array.from(merged.entries()).map(([userId, count]) => ({
                    userId,
                    count,
                })),
                limit
            );
            return res.status(200).json({ type, items: data });
        }

        if (type === "photos_reactions") {
            const rows = await Reaction.aggregate([
                { $match: { targetType: "Photo", ...rangeMatch("createdAt", from, to) } },
                {
                    $group: {
                        _id: "$targetId",
                        count: { $sum: 1 },
                        likeCount: {
                            $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] },
                        },
                        dislikeCount: {
                            $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] },
                        },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: "photos",
                        localField: "_id",
                        foreignField: "_id",
                        as: "photo",
                    },
                },
                { $unwind: "$photo" },
                {
                    $lookup: {
                        from: "users",
                        localField: "photo.user_id",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: "$user" },
                {
                    $project: {
                        _id: 0,
                        photo: {
                            _id: "$photo._id",
                            imageUrl: "$photo.imageUrl",
                            publicId: "$photo.publicId",
                        },
                        user: {
                            _id: "$user._id",
                            first_name: "$user.first_name",
                            last_name: "$user.last_name",
                            login_name: "$user.login_name",
                        },
                        count: 1,
                        likeCount: 1,
                        dislikeCount: 1,
                    },
                },
            ]);
            return res.status(200).json({ type, items: rows });
        }

        if (type === "photos_comments") {
            const rows = await Photo.aggregate([
                {
                    $project: {
                        imageUrl: 1,
                        publicId: 1,
                        user_id: 1,
                        commentCount: { $size: { $ifNull: ["$comments", []] } },
                    },
                },
                { $sort: { commentCount: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: "$user" },
                {
                    $project: {
                        _id: 0,
                        photo: { _id: "$_id", imageUrl: "$imageUrl", publicId: "$publicId" },
                        user: {
                            _id: "$user._id",
                            first_name: "$user.first_name",
                            last_name: "$user.last_name",
                            login_name: "$user.login_name",
                        },
                        count: "$commentCount",
                    },
                },
            ]);
            return res.status(200).json({ type, items: rows });
        }

        if (type === "users_active") {
            const rows = await Promise.all([
                Photo.aggregate([
                    { $match: rangeMatch("createdAt", from, to) },
                    { $group: { _id: "$user_id", count: { $sum: 1 } } },
                ]),
                Photo.aggregate([
                    { $unwind: "$comments" },
                    { $match: rangeMatch("comments.date_time", from, to) },
                    { $group: { _id: "$comments.user_id", count: { $sum: 1 } } },
                ]),
                Reaction.aggregate([
                    { $match: rangeMatch("createdAt", from, to) },
                    { $group: { _id: "$user", count: { $sum: 1 } } },
                ]),
            ]);

            const merged = new Map();
            rows.flat().forEach((r) => {
                const key = String(r._id);
                merged.set(key, (merged.get(key) || 0) + r.count);
            });

            const data = await populateUsersWithCounts(
                Array.from(merged.entries()).map(([userId, count]) => ({
                    userId,
                    count,
                })),
                limit
            );
            return res.status(200).json({ type, items: data });
        }

        return res.status(400).json({ error: "Invalid leaderboard type" });
    } catch (error) {
        console.error("getLeaderboards error:", error);
        return res.status(500).json({ error: error.message });
    }
}
