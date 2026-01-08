import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const verifyToken = (req, res, next) => {
    const token =
        req.cookies?.access_token ||
        req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Truy c?p b? t? ch?i: Thi?u token" });
    }

    try {
        const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        req.user = {
            ...decoded,
            _id: decoded._id || decoded.sub,
        };
        next();
    } catch (err) {
        console.error('verifyToken error:', err);
        return res.status(401).json({ message: "Truy c?p b? t? ch?i: Token không h?p l?" });
    }
};

export const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, async () => {
        if (req.user?.role === "admin") return next();

        try {
            const user = await User.findById(req.user?._id).select('role');
            if (user?.role === "admin") {
                req.user.role = "admin";
                return next();
            }
        } catch (err) {
            console.error('verifyAdmin error:', err);
        }

        return res.status(403).json({ message: "Yêu c?u quy?n admin ð? truy c?p tài nguyên này" });
    });
};
