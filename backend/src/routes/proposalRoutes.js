// src/routes/proposal.routes.js
import { Router } from "express";
import {
  createProposal,
  getProposalById,
  getProposalStatus,
  getMyProposals,
  getProposalsForChallenge,
} from "../controllers/proposalController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ── Engineer routes ───────────────────────────────────────────────────────
router.post("/", authenticate, requireRole("engineer"), createProposal);
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
