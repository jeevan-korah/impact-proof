// src/routes/profile.routes.js
import { Router } from "express";
import {
  getMyProfile,
  getPublicProfile,
  discoverEngineers,
  getMyProposalHistory,
} from "../controllers/profileController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ── Engineer: own profile ─────────────────────────────────────────────────
// NOTE: static routes (/me, /discover, /me/proposals) MUST come before
// the dynamic route (/:engineerId) or Express will match them as IDs
router.get("/me", authenticate, requireRole("engineer"), getMyProfile);
router.get(
  "/me/proposals",
  authenticate,
  requireRole("engineer"),
  getMyProposalHistory,
);

// ── Company: discovery ────────────────────────────────────────────────────
router.get(
  "/discover",
  authenticate,
  requireRole("company"),
  discoverEngineers,
);

// ── Public: any engineer's ledger ─────────────────────────────────────────
router.get("/:engineerId", getPublicProfile);

export default router;
