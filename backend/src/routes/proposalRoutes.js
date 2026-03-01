// src/routes/proposal.routes.js
import { Router } from "express";
import multer from "multer";
import {
  evaluate,
  getProposalById,
  getProposalStatus,
  getMyProposals,
  getProposalsForChallenge,
  generateQuiz,
} from "../controllers/proposalController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Multer setup — store uploaded .txt files in memory (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/plain" || file.originalname.endsWith(".txt")) {
      cb(null, true);
    } else {
      cb(new Error("Only .txt files are accepted"), false);
    }
  },
});

// ── Engineer routes ───────────────────────────────────────────────────────
router.post("/", authenticate, requireRole("engineer"), upload.single("proposalFile"), evaluate);
router.post("/quiz/generate", authenticate, requireRole("engineer"), generateQuiz);
router.get("/my", authenticate, requireRole("engineer"), getMyProposals);
router.get("/:id", authenticate, requireRole("engineer"), getProposalById);
router.get(
  "/:id/status",
  authenticate,
  requireRole("engineer"),
  getProposalStatus,
);

// ── Company routes ────────────────────────────────────────────────────────
router.get(
  "/challenge/:challengeId",
  authenticate,
  requireRole("company"),
  getProposalsForChallenge,
);

export default router;
