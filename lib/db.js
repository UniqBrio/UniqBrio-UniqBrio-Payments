import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    console.log("Using existing MongoDB connection");
    return;
  }

  const connectionOptions = {
    dbName: "uniqbrio",
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 30000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true,
    family: 4, // Use IPv4, skip trying IPv6
  };

  try {
    console.log("Attempting to connect to MongoDB Atlas...");
    console.log("MongoDB URI hostname:", process.env.MONGODB_URI?.split('@')[1]?.split('/')[0]);
    
    // Try primary connection
    await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    console.log("✅ MongoDB Connected Successfully");
    
  } catch (error) {
    console.error("❌ Primary DB Connection Error:", error.message);
    console.error("Error code:", error.code);
    console.error("Error name:", error.name);
    
    // If it's a DNS error, provide specific guidance
    if (error.message.includes('ENOTFOUND')) {
      console.error(`
❗ DNS Resolution Failed - Possible Solutions:
1. Check your internet connection
2. Verify MongoDB Atlas Network Access List includes your IP
3. Try different network (mobile hotspot, different WiFi)
4. Contact your ISP if DNS issues persist
5. Check if corporate firewall is blocking MongoDB Atlas

Current IP might need to be whitelisted in MongoDB Atlas Network Access.
      `);
    }
    
    throw error; // Re-throw to handle in calling code
  }
}
