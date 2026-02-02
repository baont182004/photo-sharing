import app from './app.js';
import dbConnect from './config/db.js';
import dotenv from 'dotenv';
import { oauthProviders } from './config/oauthProviders.js';

dotenv.config();

const PORT = process.env.PORT;

if (!oauthProviders.github.clientId || !oauthProviders.github.clientSecret) {
    console.warn(
        'GitHub OAuth not configured: missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET'
    );
}

try {
    await dbConnect();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
} catch (error) {
    console.error("Failed to start server:", error);
}
