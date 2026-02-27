// src/routes/submission.routes.js
import { Router } from "express";
import {
  createSubmission,
  getSubmission,
  getSubmissionStatus,
  getMySubmissions,
} from "../controllers/submissionController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// All submission routes require authentication + engineer role
router.use(authenticate, requireRole("engineer"));

router.post("/", createSubmission);
router.get("/my", getMySubmissions);
router.get("/:id", getSubmission);
router.get("/:id/status", getSubmissionStatus);

export default router;
