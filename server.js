import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

import bookRoutes from "./routes/bookRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use(express.static(path.join(__dirname, "frontend")));

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Library Management System API is running",
  });
});

app.use("/api/v1/books", bookRoutes);
app.use("/api/v1/transactions", transactionRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`API: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
