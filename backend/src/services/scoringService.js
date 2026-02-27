// src/services/scoring.service.js
import crypto from "crypto";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// ─────────────────────────────────────────────
// computeCodeFingerprint
// Clones the repo, hashes the content of all
// source files to produce a structural fingerprint.
// Used for similarity detection across submissions.
// ─────────────────────────────────────────────
export async function computeCodeFingerprint(repoUrl) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fingerprint-"));

  try {
    execSync(`git clone --depth=1 ${repoUrl} ${tmpDir}/repo`, {
      timeout: 60000,
    });

    const sourceFiles = getSourceFiles(`${tmpDir}/repo`);

    // Concatenate all source file contents, normalise whitespace, hash
    const combined = sourceFiles
      .map((f) => {
        const content = fs.readFileSync(f, "utf8");
        return normaliseCode(content);
      })
      .join("\n---\n");

    const fingerprint = crypto
      .createHash("sha256")
      .update(combined)
      .digest("hex");
    return fingerprint;
  } catch (error) {
    console.error("[computeCodeFingerprint]", error);
    return null;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────
// checkSimilarity
// Compares two fingerprints.
// For hackathon: simple exact-match check.
// In production: use MinHash/SimHash for fuzzy matching.
// Returns 0.0 - 1.0 (1.0 = identical)
// ─────────────────────────────────────────────
export function checkSimilarity(fingerprintA, fingerprintB) {
  if (!fingerprintA || !fingerprintB) return 0;

  // Exact match = 1.0
  if (fingerprintA === fingerprintB) return 1.0;

  // Partial similarity: compare first 32 chars (prefix of sha256)
  // This catches trivially renamed/reformatted copies
  const prefixLength = 16;
  const prefixA = fingerprintA.substring(0, prefixLength);
  const prefixB = fingerprintB.substring(0, prefixLength);

  if (prefixA === prefixB) return 0.9;

  // Character-level similarity on the full hash
  // (crude approximation — replace with SimHash in production)
  let matches = 0;
  const len = Math.min(fingerprintA.length, fingerprintB.length);
  for (let i = 0; i < len; i++) {
    if (fingerprintA[i] === fingerprintB[i]) matches++;
  }

  return matches / len;
}

// ─────────────────────────────────────────────
// computeKpiScore
// Stateless score computation — used for display
// purposes before the profile aggregation runs.
// ─────────────────────────────────────────────
export function computeKpiScore({
  passRate,
  avgImprovementDelta,
  proposalAcceptanceRate,
  difficulty,
}) {
  const difficultyMultiplier =
    { easy: 1, medium: 1.5, hard: 2 }[difficulty] ?? 1;

  const normalisedImpact = Math.min(
    avgImprovementDelta * difficultyMultiplier * 2,
    100,
  );

  const score =
    passRate * 40 + normalisedImpact * 0.4 + proposalAcceptanceRate * 20;

  return parseFloat(score.toFixed(2));
}

// ─────────────────────────────────────────────
// UTIL — get all source files from cloned repo
// Ignores node_modules, .git, build output dirs
// ─────────────────────────────────────────────
function getSourceFiles(dir) {
  const IGNORE = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "__pycache__",
    ".venv",
    "venv",
    "env",
  ]);

  const SOURCE_EXTENSIONS = new Set([
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".css",
    ".html",
    ".json",
  ]);

  const results = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE.has(entry.name)) continue;

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results.sort(); // Sort for deterministic ordering
}

// ─────────────────────────────────────────────
// UTIL — normalise code before hashing
// Strips comments, collapses whitespace, lowercases
// to reduce false negatives from superficial edits
// ─────────────────────────────────────────────
function normaliseCode(code) {
  return code
    .replace(/\/\/.*$/gm, "") // remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // remove multi-line comments
    .replace(/#.*$/gm, "") // remove Python comments
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
    .toLowerCase();
}
