import app from './app.js';
import dbConnect from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT;

try {
    await dbConnect();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
} catch (error) {
    console.error("Failed to start server:", error);
}
