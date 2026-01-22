import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || '';

if (!MONGO_URI) {
    throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        console.log("Using cached MongoDB connection");
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            connectTimeoutMS: 10000,
        };

        console.log("Attempting new MongoDB connection...");
        cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
            console.log("MongoDB connected successfully");
            return mongoose;
        }).catch(err => {
            console.error("MongoDB connection error:", err);
            cached.promise = null;
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("Failed to await MongoDB promise:", e);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
