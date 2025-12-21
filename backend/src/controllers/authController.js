import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function login(req, res) {
    try {
        const { login_name, password } = req.body || {};
        if (!login_name) return res.status(400).send('login_name is required');

        const user = await User.findOne({ login_name }).select("+password");
        if (!user) return res.status(400).send('Invalid login_name');

        if (!password || password !== user.password) {
            return res.status(400).send('Invalid password');
        }

        const payload = {
            _id: user._id.toString(),
            login_name: user.login_name,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role || "user",
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });

        return res.status(200).json({ token, user: payload });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).send('Server error');
    }
}

export async function logout(req, res) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(400).send('Not logged in');

    return res.status(200).send();
}
