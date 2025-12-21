import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Truy cập bị từ chối: Thiếu token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('verifyToken error:', err);
        return res.status(401).json({ message: "Truy cập bị từ chối: Token không hợp lệ" });
    }
};

export const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === "admin") next();
        else res.status(403).json({ message: "Yêu cầu quyền admin để truy cập tài nguyên này" });
    });
};
