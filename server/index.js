import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";

import database from "./config/db.js";
import swaggerSpecs from "./config/swagger.js";
import authRouter from "./routes/authRouter.js";
import postRouter from "./routes/postRouter.js";
import errorMiddleware from "./middleware/error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment-specific .env file
// Defaults to development if NODE_ENV is not set
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = nodeEnv === "production" 
  ? ".env.production" 
  : ".env.development";

dotenv.config({ path: path.join(__dirname, envFile) });
console.log(`📝 Loading environment: ${nodeEnv} from ${envFile}`);

const app = express();
const port = process.env.PORT || 5274;
const host = process.env.HOST || "0.0.0.0"; // Listen on all interfaces to allow mobile app access

// Database connection event handlers
database.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});

database.on("connected", () => {
  console.log("✅ Database connected");
});

database.on("disconnected", () => {
  console.warn("⚠️ Database disconnected");
});

// CORS configuration - allow requests from mobile app
app.use(
  cors({
    origin: process.env.CLIENT_BASE_URL || "*", // Allow all origins for mobile app, or set specific URL
    optionsSuccessStatus: 200,
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
// This makes files accessible at http://BASE_URL/uploads/filename.ext
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Log static file serving configuration
console.log("📁 Static files served from:", path.join(__dirname, "uploads"));
console.log("🌐 Static files accessible at: http://localhost:" + port + "/uploads/");

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Book Hive API Documentation",
  })
);

app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);

app.get("/", (_, res) =>
  res.json({ message: `Welcome to ${process.env.PROJECT_NAME} backend.` })
);

app.all("*", (_, res) => res.json({ message: "Route not found", status: 404 }));

// Error Handling Middleware (must be last)
app.use(errorMiddleware);

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}!`);
  console.log(`Local access: http://localhost:${port}`);
  console.log(`Network access: http://192.168.18.207:${port}`);
  console.log(`API Documentation: http://${host}:${port}/api-docs`);
});
