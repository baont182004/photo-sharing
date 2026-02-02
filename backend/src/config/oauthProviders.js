import dotenv from 'dotenv';

dotenv.config();

const github = {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userApiUrl: 'https://api.github.com/user',
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI,
    scope: process.env.GITHUB_SCOPE || 'read:user',
    frontendRedirectUrl: process.env.FRONTEND_REDIRECT_URL,
};

export const oauthProviders = { github };
