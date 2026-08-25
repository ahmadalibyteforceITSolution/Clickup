import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

// Ensure SRV DNS records resolve reliably on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ClickUp';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 6000
    });
    isConnected = true;
    console.log(`🍃 Connected directly to MongoDB Atlas: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.warn(`⚠️ Could not connect to primary MongoDB at ${mongoUri}: ${error.message}`);
    console.log('🔄 Attempting fallback: connecting to Mongo Memory Server or local instance...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      isConnected = true;
      console.log(`🍃 Connected to In-Memory MongoDB instance at: ${uri}`);
      return conn.connection;
    } catch (memError) {
      console.error('Failed to initialize in-memory MongoDB fallback:', memError.message);
      throw error;
    }
  }
}

export default connectDB;
