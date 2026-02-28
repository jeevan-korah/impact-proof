// src/routes/challenges.routes.js
import { Router } from "express";
import {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallengeStatus,
  getMyChallenges,
  getChallengeLeaderboard,
  getChallengeProposals,
} from "../controllers/challengesController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────
// Note: getChallengeById optionally reads the auth token for engineer progress
// but does NOT enforce authentication — handled internally in the controller
router.get("/", getChallenges);
router.get("/:id", getChallengeById);
router.get("/:id/leaderboard", getChallengeLeaderboard);

// ── Company only ──────────────────────────────────────────────────────────
router.post("/", authenticate, requireRole("company"), createChallenge);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("company"),
  updateChallengeStatus,
);
router.get(
  "/company/my",
  authenticate,
  requireRole("company"),
  getMyChallenges,
);
router.get(
  "/:id/proposals",
  authenticate,
  requireRole("company"),
  getChallengeProposals,
);

export default router;
