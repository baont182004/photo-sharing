import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function dbConnect() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Successfully connected to MongoDB Atlas!');
  } catch (error) {
    console.log('Unable to connect to MongoDB Atlas!');
    console.error(error);
  }
}

export default dbConnect;
