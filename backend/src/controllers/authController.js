import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import {
    signAccessToken,
    signRefreshToken,
    sha256,
} from '../utils/tokens.js';
import {
    getAccessCookieOptions,
    getRefreshCookieOptions,
} from '../config/cookies.js';

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

        const family = randomUUID();
        const accessToken = signAccessToken(user._id);
        const refreshToken = signRefreshToken(user._id, family);
        const decodedRefresh = jwt.decode(refreshToken);

        if (!decodedRefresh?.jti || !decodedRefresh?.exp) {
            throw new Error('Invalid refresh token payload');
        }

        await RefreshToken.create({
            user: user._id,
            tokenHash: sha256(refreshToken),
            jti: decodedRefresh.jti,
            family,
            expiresAt: new Date(decodedRefresh.exp * 1000),
            ip: req.ip,
            userAgent: req.get('user-agent') || '',
        });

        res.cookie('access_token', accessToken, getAccessCookieOptions());
        res.cookie('refresh_token', refreshToken, getRefreshCookieOptions());

        const responseBody = { user: payload };
        if (process.env.RETURN_ACCESS_TOKEN_IN_BODY === 'true') {
            responseBody.token = accessToken;
        }

        return res.status(200).json(responseBody);
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).send('Server error');
    }
}

export async function logout(req, res) {
    res.clearCookie('access_token', getAccessCookieOptions());
    res.clearCookie('refresh_token', getRefreshCookieOptions());
    return res.status(200).send();
}
