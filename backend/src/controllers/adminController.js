import User from '../models/User.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseLimit(rawLimit) {
    const parsed = Number.parseInt(rawLimit, 10);
    if (Number.isNaN(parsed)) return DEFAULT_LIMIT;
    return Math.min(MAX_LIMIT, Math.max(1, parsed));
}

function parsePage(rawPage) {
    const parsed = Number.parseInt(rawPage, 10);
    if (Number.isNaN(parsed)) return 1;
    return Math.max(1, parsed);
}

// GET /admin/users
export async function getAdminUsers(req, res) {
    try {
        const limit = parseLimit(req.query.limit);
        const page = parsePage(req.query.page);
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const skip = (page - 1) * limit;

        const match = {};
        if (search) {
            const regex = new RegExp(escapeRegex(search), 'i');
            match.$or = [
                { first_name: { $regex: regex } },
                { last_name: { $regex: regex } },
                { login_name: { $regex: regex } },
            ];
        }

        const [total, items] = await Promise.all([
            User.countDocuments(match),
            User.aggregate([
                { $match: match },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'photos',
                        let: { userId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$user_id', '$$userId'] },
                                },
                            },
                            { $count: 'count' },
                        ],
                        as: 'photoCounts',
                    },
                },
                {
                    $lookup: {
                        from: 'photos',
                        let: { userId: '$_id' },
                        pipeline: [
                            { $project: { comments: 1 } },
                            {
                                $project: {
                                    commentCount: {
                                        $size: {
                                            $filter: {
                                                input: '$comments',
                                                as: 'c',
                                                cond: { $eq: ['$$c.user_id', '$$userId'] },
                                            },
                                        },
                                    },
                                },
                            },
                            {
                                $group: {
                                    _id: null,
                                    count: { $sum: '$commentCount' },
                                },
                            },
                        ],
                        as: 'commentCounts',
                    },
                },
                {
                    $lookup: {
                        from: 'friendships',
                        let: { userId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ['$$userId', '$users'] },
                                },
                            },
                            { $count: 'count' },
                        ],
                        as: 'friendCounts',
                    },
                },
                {
                    $addFields: {
                        photoCount: {
                            $ifNull: [{ $arrayElemAt: ['$photoCounts.count', 0] }, 0],
                        },
                        commentCount: {
                            $ifNull: [{ $arrayElemAt: ['$commentCounts.count', 0] }, 0],
                        },
                        friendCount: {
                            $ifNull: [{ $arrayElemAt: ['$friendCounts.count', 0] }, 0],
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        first_name: 1,
                        last_name: 1,
                        login_name: 1,
                        role: 1,
                        createdAt: 1,
                        photoCount: 1,
                        commentCount: 1,
                        friendCount: 1,
                    },
                },
            ]),
        ]);

        return res.status(200).json({
            items,
            total,
            page,
            limit,
        });
    } catch (error) {
        console.error('getAdminUsers error:', error);
        return res.status(500).json({ error: error.message });
    }
}
