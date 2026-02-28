// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import challengeRoutes from "./routes/challengesRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/proposal", proposalRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/profile", profileRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[unhandled error]", err);
  res.status(500).json({ success: false, message: "internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`server running on http://localhost:${PORT}`),
);

export default app;
