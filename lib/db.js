import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const connectionOptions = {
    dbName: "uniqbrio",
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 15000,
    connectTimeoutMS: 10000,
    maxPoolSize: 5,
    retryWrites: true,
    ssl: true,
    tlsAllowInvalidCertificates: true,
  };

  try {
    await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
}
