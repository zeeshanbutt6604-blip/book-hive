import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment-specific .env file
// Defaults to development if NODE_ENV is not set
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = nodeEnv === "production" 
  ? ".env.production" 
  : ".env.development";

dotenv.config({ path: path.join(__dirname, "..", envFile) });
console.log(`📝 Loading environment: ${nodeEnv} from ${envFile}`);

mongoose.set("strictQuery", false);

// Database name is already included in the connection string
const DB_OPTIONS = {
  // dbName is already in the connection string, so we don't need it here
  retryWrites: true,
  w: 'majority',
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
    console.error("1. MongoDB Atlas IP whitelist - add your IP address at: https://cloud.mongodb.com/network/access");
    console.error("2. Database user credentials are correct (username and password)");
    console.error("3. DB_CONNECTION string is correct in .env file");
    console.error("4. Database user has proper permissions (read/write access)");
    console.error("5. Network connectivity to MongoDB Atlas");
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
