import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.set("strictQuery", false);

const DB_OPTIONS = {
  dbName: process.env.DB_NAME,
};

// Ensure DB_CONNECTION is defined
if (!process.env.DB_CONNECTION) {
  console.error("DB_CONNECTION is not defined in .env file!");
  process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_CONNECTION, DB_OPTIONS);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.error("Please check:");
    console.error("1. MongoDB is running");
    console.error("2. DB_CONNECTION string is correct in .env file");
    console.error("3. Network connectivity");
    process.exit(1);
  }
};

// Handle connection events
const db = mongoose.connection;

db.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

db.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
});

db.on("reconnected", () => {
  console.log("✅ MongoDB reconnected");
});

// Connect to database
connectDB();

export default db;
