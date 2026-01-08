export function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
    const hits = new Map();

    return (req, res, next) => {
        const userKey = req.user?._id || req.ip || "unknown";
        const key = `${userKey}:${req.path}`;
        const now = Date.now();
        const entry = hits.get(key) || { count: 0, start: now };

        if (now - entry.start > windowMs) {
            entry.count = 0;
            entry.start = now;
        }

        entry.count += 1;
        hits.set(key, entry);

        if (entry.count > max) {
            return res.status(429).json({ error: "Too many requests" });
        }

        return next();
    };
}
