import { randomBytes, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { oauthProviders } from '../config/oauthProviders.js';
import { getAccessCookieOptions, getRefreshCookieOptions } from '../config/cookies.js';
import { signAccessToken, signRefreshToken, sha256 } from '../utils/tokens.js';
import { logBlock } from '../utils/oauthLogger.js';

function stateCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
        path: '/api/auth/github/callback',
    };
}

function clearStateCookie(res) {
    res.clearCookie('oauth_state', { path: '/api/auth/github/callback' });
}

function ensureGithubConfig(res) {
    const cfg = oauthProviders.github;
    if (!cfg?.clientId || !cfg?.clientSecret || !cfg?.redirectUri) {
        res.status(500).json({ error: 'GitHub OAuth not configured' });
        return null;
    }
    return cfg;
}

export async function startGithubAuth(req, res) {
    const cfg = ensureGithubConfig(res);
    if (!cfg) return;

    const state = randomBytes(16).toString('hex');
    res.cookie('oauth_state', state, stateCookieOptions());

    const params = new URLSearchParams({
        client_id: cfg.clientId,
        redirect_uri: cfg.redirectUri,
        scope: cfg.scope || 'read:user',
        state,
        allow_signup: 'true',
    });

    logBlock('STEP 1/6 CLIENT -> [AUTHZ_SERVER] Authorization Request', {
        authz_endpoint: cfg.authorizeUrl,
        client_id: cfg.clientId,
        redirect_uri: cfg.redirectUri,
        scope: cfg.scope || 'read:user',
        state,
    }, req.requestId);

    return res.redirect(`${cfg.authorizeUrl}?${params.toString()}`);
}

export async function githubCallback(req, res) {
    const cfg = ensureGithubConfig(res);
    if (!cfg) return;

    const code = req.query?.code;
    const state = req.query?.state;
    const cookieState = req.cookies?.oauth_state;

    if (!code || !state || state !== cookieState) {
        logBlock('STEP 2/6 CLIENT <- [AUTHZ_SERVER] Authorization Grant (state mismatch)', {
            callback_path: `${req.baseUrl || ''}${req.path || ''}` || '/api/auth/github/callback',
            code,
            state,
            state_check: 'FAIL',
        }, req.requestId);
        clearStateCookie(res);
        return res.status(400).json({ error: 'Invalid OAuth state' });
    }

    logBlock('STEP 2/6 CLIENT <- [AUTHZ_SERVER] Authorization Grant', {
        callback_path: `${req.baseUrl || ''}${req.path || ''}` || '/api/auth/github/callback',
        code,
        state,
        state_check: 'OK',
    }, req.requestId);

    logBlock('STEP 3/6 CLIENT -> [AUTHZ_SERVER] Token Request', {
        token_endpoint: cfg.tokenUrl,
    }, req.requestId);
    let tokenResponse;
    try {
        tokenResponse = await fetch(cfg.tokenUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: cfg.clientId,
                client_secret: cfg.clientSecret,
                code,
                redirect_uri: cfg.redirectUri,
            }),
        });
    } catch (err) {
        clearStateCookie(res);
        return res.status(502).json({ error: 'Failed to exchange token' });
    }

    const tokenData = await tokenResponse.json().catch(() => null);
    const accessToken = tokenData?.access_token;
    if (!accessToken) {
        clearStateCookie(res);
        return res.status(400).json({ error: 'Token exchange failed' });
    }

    logBlock('STEP 4/6 CLIENT <- [AUTHZ_SERVER] Token Response', {
        token_len: String(accessToken).length,
        scope: tokenData?.scope || '',
        token_type: tokenData?.token_type || '',
        expires_in: tokenData?.expires_in || '',
    }, req.requestId);

    logBlock('STEP 5/6 CLIENT -> [RESOURCE_SERVER] Fetch User', {
        resource: cfg.userApiUrl,
    }, req.requestId);
    const userResp = await fetch(cfg.userApiUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'photo-sharing-app',
            Accept: 'application/json',
        },
    });
    const ghUser = await userResp.json().catch(() => null);

    logBlock('STEP 6/6 CLIENT <- [RESOURCE_SERVER] User Profile', {
        'github.id': ghUser?.id,
        'github.login': ghUser?.login,
        'github.name': ghUser?.name,
        'github.avatar_url': ghUser?.avatar_url,
    }, req.requestId);

    if (!ghUser?.id || !ghUser?.login) {
        clearStateCookie(res);
        return res.status(400).json({ error: 'Invalid GitHub user profile' });
    }

    const providerId = String(ghUser.id);
    let user = await User.findOne({
        auth_provider: 'github',
        provider_user_id: providerId,
    });

    if (!user) {
        const rawName = ghUser.name ? String(ghUser.name).trim() : '';
        const nameParts = rawName ? rawName.split(/\s+/) : [];
        const firstName = nameParts[0] || ghUser.login || 'User';
        const lastName =
            nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'GitHub';
        user = await User.create({
            login_name: `gh_${providerId}`,
            password: randomUUID(),
            first_name: firstName,
            last_name: lastName,
            auth_provider: 'github',
            provider_user_id: providerId,
            display_name: rawName || firstName,
            handle: ghUser.login,
            avatar_url: ghUser.avatar_url || '',
            primary_email: null,
        });
    }
    const rid = req.requestId ? `[RID=${req.requestId}]` : '';
    console.log(`${rid}[APP-AUTH] Mapped to internal user`, {
        github_name: ghUser?.name || '',
        internal_user_id: user._id.toString(),
        display_name: user.display_name || '',
        handle: user.handle ? `@${user.handle}` : '',
    });

    const payload = {
        _id: user._id.toString(),
        login_name: user.login_name,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role || 'user',
        handle: user.handle || undefined,
        display_name: user.display_name || undefined,
    };

    const family = randomUUID();
    const accessTokenIssued = signAccessToken(user._id);
    const refreshTokenIssued = signRefreshToken(user._id, family);
    const decodedRefresh = jwt.decode(refreshTokenIssued);

    if (!decodedRefresh?.jti || !decodedRefresh?.exp) {
        clearStateCookie(res);
        return res.status(500).json({ error: 'Invalid refresh token payload' });
    }

    await RefreshToken.create({
        user: user._id,
        tokenHash: sha256(refreshTokenIssued),
        jti: decodedRefresh.jti,
        family,
        expiresAt: new Date(decodedRefresh.exp * 1000),
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
    });

    res.cookie('access_token', accessTokenIssued, getAccessCookieOptions());
    res.cookie('refresh_token', refreshTokenIssued, getRefreshCookieOptions());

    console.log(`${rid}[APP-AUTH] Issued app JWT cookies`, {
        user_id: user._id.toString(),
        access_ttl: process.env.ACCESS_TOKEN_TTL || '15m',
        refresh_ttl: process.env.REFRESH_TOKEN_TTL || '30d',
    });

    clearStateCookie(res);
    const redirectUrl = cfg.frontendRedirectUrl || 'http://localhost:3000/';
    console.log(`${rid}[APP-AUTH] Redirecting back to frontend`, { url: redirectUrl });
    console.log(
        `${rid}[OAUTH2] DONE provider=github internal_user_id=${user._id.toString()} handle=@${user.handle || ''} display_name=${user.display_name || ''}`
    );
    return res.redirect(redirectUrl);
}
