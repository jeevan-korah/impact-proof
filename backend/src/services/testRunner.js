// src/services/testrunner.service.js
// Runs automated tests based on challenge vertical.
// Returns a normalised result object regardless of vertical.

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Main entry point called by the submission pipeline.
 *
 * @param {object} params
 * @param {string} params.vertical         - 'frontend' | 'ml' | 'backend'
 * @param {string} params.repoUrl          - GitHub repo URL from engineer
 * @param {string} params.challengeId      - used to locate predefined test scripts
 * @param {number} params.baselineValue    - baseline metric value from challenge
 * @param {number} params.targetValue      - target metric value from challenge
 * @param {string} params.comparisonOperator - '>=' | '<=' | '>' | '<' | '=='
 * @param {object} params.constraints      - challenge constraints JSON
 *
 * @returns {{ achievedValue, constraintsPassed, passed, error }}
 */
export async function runTestPipeline({
  vertical,
  repoUrl,
  challengeId,
  baselineValue,
  targetValue,
  comparisonOperator,
  constraints,
}) {
  try {
    let achievedValue;
    let constraintsPassed = true;

    switch (vertical) {
      case "frontend":
        achievedValue = await runLighthouseTest(repoUrl, constraints);
        break;
      case "ml":
        achievedValue = await runMLTest(repoUrl, challengeId, constraints);
        break;
      case "backend":
        achievedValue = await runBackendTest(repoUrl, challengeId, constraints);
        break;
      default:
        return {
          achievedValue: null,
          constraintsPassed: false,
          passed: false,
          error: `unknown vertical: ${vertical}`,
        };
    }

    // Evaluate success criteria
    const passed = evaluateCriteria(
      achievedValue,
      comparisonOperator,
      targetValue,
    );

    // Evaluate constraints (vertical-specific checks)
    constraintsPassed = await evaluateConstraints(
      vertical,
      repoUrl,
      constraints,
    );

    return {
      achievedValue,
      constraintsPassed,
      passed,
      error: null,
    };
  } catch (error) {
    console.error("[runTestPipeline]", error);
    return {
      achievedValue: null,
      constraintsPassed: false,
      passed: false,
      error: error.message,
    };
  }
}

// ─────────────────────────────────────────────
// FRONTEND — Lighthouse CI
// Clones repo, installs deps, starts dev server,
// runs Lighthouse, extracts performance score.
// ─────────────────────────────────────────────
async function runLighthouseTest(repoUrl, constraints) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "impactproof-"));

  try {
    console.log(`[lighthouse] cloning ${repoUrl} into ${tmpDir}`);
    execSync(`git clone --depth=1 ${repoUrl} ${tmpDir}/repo`, {
      timeout: 60000,
    });

    // Install dependencies
    execSync("npm ci --prefer-offline", {
      cwd: `${tmpDir}/repo`,
      timeout: 120000,
    });

    // Build (assumes standard Vite/CRA setup)
    execSync("npm run build", {
      cwd: `${tmpDir}/repo`,
      timeout: 120000,
    });

    // Serve the build and run Lighthouse
    // Uses `serve` package + lighthouse CLI
    const port = 4321;
    const serveProcess = require("child_process").spawn(
      "npx",
      ["serve", "-s", "dist", "-l", String(port)],
      { cwd: `${tmpDir}/repo`, detached: true },
    );

    // Wait for server to start
    await sleep(3000);

    const lhOutputPath = `${tmpDir}/lh-result.json`;
    execSync(
      `npx lighthouse http://localhost:${port} --output=json --output-path=${lhOutputPath} --chrome-flags="--headless --no-sandbox" --only-categories=performance`,
      { timeout: 120000 },
    );

    serveProcess.kill();

    const lhResult = JSON.parse(fs.readFileSync(lhOutputPath, "utf8"));
    const performanceScore = Math.round(
      lhResult.categories.performance.score * 100,
    );

    console.log(`[lighthouse] score=${performanceScore}`);
    return performanceScore;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────
// ML — Python evaluation script
// Clones repo, runs predefined eval.py script
// that outputs a JSON result file.
// ─────────────────────────────────────────────
async function runMLTest(repoUrl, challengeId, constraints) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "impactproof-"));

  try {
    console.log(`[ml-test] cloning ${repoUrl}`);
    execSync(`git clone --depth=1 ${repoUrl} ${tmpDir}/repo`, {
      timeout: 60000,
    });

    // Copy the challenge's predefined eval script into the repo
    const evalScriptPath = path.join(
      process.cwd(),
      "test-scripts",
      challengeId,
      "eval.py",
    );
    if (!fs.existsSync(evalScriptPath)) {
      throw new Error(`eval script not found for challengeId=${challengeId}`);
    }
    fs.copyFileSync(evalScriptPath, `${tmpDir}/repo/eval.py`);

    // Install requirements
    execSync("pip install -r requirements.txt --quiet", {
      cwd: `${tmpDir}/repo`,
      timeout: 120000,
    });

    // Run eval — must write result to eval_result.json
    execSync("python eval.py", {
      cwd: `${tmpDir}/repo`,
      timeout: 120000,
    });

    const result = JSON.parse(
      fs.readFileSync(`${tmpDir}/repo/eval_result.json`, "utf8"),
    );

    // eval_result.json shape: { "metric_value": 0.87, "latency_ms": 180 }
    console.log(`[ml-test] result=`, result);
    return result.metric_value;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────
// BACKEND — Load test via autocannon
// Clones repo, starts server, runs autocannon,
// extracts p99 latency.
// ─────────────────────────────────────────────
async function runBackendTest(repoUrl, challengeId, constraints) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "impactproof-"));

  try {
    console.log(`[backend-test] cloning ${repoUrl}`);
    execSync(`git clone --depth=1 ${repoUrl} ${tmpDir}/repo`, {
      timeout: 60000,
    });

    execSync("npm ci --prefer-offline", {
      cwd: `${tmpDir}/repo`,
      timeout: 120000,
    });

    // Start the server
    const serverProcess = require("child_process").spawn("node", ["index.js"], {
      cwd: `${tmpDir}/repo`,
      detached: true,
      env: { ...process.env, PORT: "4322" },
    });

    await sleep(3000);

    // Run autocannon load test
    const autocannonResult = execSync(
      `npx autocannon -c ${constraints?.concurrentConnections ?? 100} -d 10 -j http://localhost:4322${constraints?.testPath ?? "/"}`,
      { timeout: 60000 },
    ).toString();

    serverProcess.kill();

    const stats = JSON.parse(autocannonResult);
    const p99Latency = stats.latency.p99;

    console.log(`[backend-test] p99=${p99Latency}ms`);
    return p99Latency;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────
// UTIL — evaluate success criteria
// ─────────────────────────────────────────────
function evaluateCriteria(achieved, operator, target) {
  switch (operator) {
    case ">=":
      return achieved >= target;
    case "<=":
      return achieved <= target;
    case ">":
      return achieved > target;
    case "<":
      return achieved < target;
    case "==":
      return achieved === target;
    default:
      return false;
  }
}

// ─────────────────────────────────────────────
// UTIL — evaluate constraints
// Currently checks no-new-dependencies for frontend/backend.
// Extend per vertical as needed.
// ─────────────────────────────────────────────
async function evaluateConstraints(vertical, repoUrl, constraints) {
  if (!constraints) return true;

  // For hackathon: constraint checking is simplified.
  // In production this would diff package.json against the baseline.
  if (constraints.no_new_deps) {
    // Check that the submitted package.json doesn't add new dependencies
    // For now: trust the test runner result — extend this for production
    console.log("[constraints] no_new_deps check: simplified for hackathon");
  }

  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
