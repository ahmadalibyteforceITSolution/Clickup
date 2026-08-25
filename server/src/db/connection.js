import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

// Only apply custom DNS servers on local Windows machines, not on Vercel Linux
if (process.platform === 'win32' && !process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (e) {
    // Ignore
  }
}

const DEFAULT_URI = 'mongodb+srv://ahmedalihafeez25_db_user:%40Sublime12345@cluster0.oe0inne.mongodb.net/ClickUp?retryWrites=true&w=majority';

let cachedConn = null;
let cachedPromise = null;

export async function connectDB() {
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  if (!cachedPromise) {
    const mongoUri = process.env.MONGODB_URI || DEFAULT_URI;

    cachedPromise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    }).then((m) => {
      console.log(`🍃 Connected directly to MongoDB Atlas: ${m.connection.host}/${m.connection.name}`);
      return m.connection;
    }).catch((err) => {
      cachedPromise = null;
      console.error(`⚠️ MongoDB Atlas connection failed: ${err.message}`);
      throw err;
    });
  }

  try {
    cachedConn = await cachedPromise;
    return cachedConn;
  } catch (e) {
    cachedPromise = null;
    throw e;
  }
}

export default connectDB;
