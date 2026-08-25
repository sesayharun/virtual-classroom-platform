import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import classRoutes from "./routes/classes.js";
import { verifyDatabaseConnection } from "./config/db.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "virtual-classroom-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required. Copy .env.example to .env and configure it.");
  }

  await verifyDatabaseConnection();
  app.listen(port, () => {
    console.log(`Virtual Classroom API running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Unable to start the API:", error.message);
  process.exit(1);
});
