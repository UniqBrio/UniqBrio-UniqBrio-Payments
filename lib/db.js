import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "uniqbrio", 
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("DB Connection Error:", error);
  }
}
