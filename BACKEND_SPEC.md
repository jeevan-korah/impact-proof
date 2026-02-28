# ImpactProof — Backend Specification

> Complete reference for building a React frontend against this Express + Prisma backend.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Environment & Config](#environment--config)
4. [Data Models (Prisma Schema)](#data-models-prisma-schema)
5. [Enums](#enums)
6. [Authentication](#authentication)
7. [API Endpoints](#api-endpoints)
   - [Auth](#auth-routes)
   - [Challenges](#challenge-routes)
   - [Proposals](#proposal-routes)
   - [Submissions](#submission-routes)
   - [Profile](#profile-routes)
8. [Services (Internal)](#services-internal)
9. [Response Envelope](#response-envelope)
10. [Role-Based Access Summary](#role-based-access-summary)
11. [User Flows](#user-flows)
12. [File Tree](#file-tree)

---

## Project Overview

**ImpactProof** is a platform where:

- **Companies** post real-world KPI improvement challenges (e.g. "reduce p99 latency from 320ms to under 100ms").
- **Engineers** submit diagnostic proposals evaluated by an LLM (Claude). Shortlisted engineers submit code solutions that are automatically benchmarked.
- Every result (pass or fail) is recorded in an immutable **impact ledger**, building a verifiable credibility profile.
- Companies can **discover and recruit** engineers based on proven, quantified impact — not resumes.

There are **two roles**: `engineer` and `company`. Each role has distinct UI surfaces and permissions.

---

## Tech Stack

| Layer      | Technology                           |
| ---------- | ------------------------------------ |
| Runtime    | Node.js (ES modules)                 |
| Framework  | Express 5                            |
| Database   | PostgreSQL                           |
| ORM        | Prisma 7 (with `@prisma/adapter-pg`) |
| Auth       | JWT (jsonwebtoken + bcryptjs)        |
| LLM        | Anthropic Claude API                 |
| Load Test  | autocannon                           |
| Perf Test  | Lighthouse                           |
| Dev Server | nodemon                              |

---
c
## Environment & Config

The backend expects these environment variables (via `.env`):

| Variable            | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection string                                |
| `JWT_SECRET`        | Secret key for signing JWTs                                 |
| `JWT_EXPIRES_IN`    | Token lifetime (default: `"7d"`)                            |
| `ANTHROPIC_API_KEY` | API key for Claude LLM evaluation                           |
| `CLIENT_URL`        | Frontend origin for CORS (default: `http://localhost:5173`) |
| `PORT`              | Server port (default: `3000`)                               |

CORS is configured with `credentials: true` and allows the `CLIENT_URL` origin.

---

## Data Models (Prisma Schema)

### User

| Field          | Type       | Notes                              |
| -------------- | ---------- | ---------------------------------- |
| `id`           | `String`   | UUID, primary key                  |
| `email`        | `String`   | Unique                             |
| `passwordHash` | `String`   | bcrypt hash (never sent to client) |
| `name`         | `String`   |                                    |
| `role`         | `Role`     | `"engineer"` or `"company"`        |
| `githubUrl`    | `String?`  | Optional                           |
| `createdAt`    | `DateTime` | Auto                               |

**Relations:** has many `Challenge` (if company), `Proposal`, `Submission`, `ImpactRecord`. Has one optional `EngineerProfile`.

---

### Challenge

| Field                | Type              | Notes                                |
| -------------------- | ----------------- | ------------------------------------ |
| `id`                 | `String`          | UUID                                 |
| `postedById`         | `String?`         | FK → User (the company)              |
| `title`              | `String`          |                                      |
| `description`        | `String`          |                                      |
| `vertical`           | `Vertical`        | `"frontend"`, `"backend"`, `"ml"`    |
| `difficulty`         | `Difficulty`      | `"easy"`, `"medium"`, `"hard"`       |
| `source`             | `ChallengeSource` | `"company"` or `"opensource"`        |
| `baselineValue`      | `Float`           | Current metric value                 |
| `targetValue`        | `Float`           | Required metric value                |
| `comparisonOperator` | `String`          | `">="`, `"<="`, `">"`, `"<"`, `"=="` |
| `constraints`        | `Json?`           | Optional JSON object                 |
| `repoUrl`            | `String?`         | Optional GitHub repo                 |
| `issueUrl`           | `String?`         | Required for `opensource` source     |
| `status`             | `ChallengeStatus` | `"open"` (default) or `"closed"`     |
| `createdAt`          | `DateTime`        | Auto                                 |

**Relations:** belongs to `User` (postedBy), has many `Proposal`, `Submission`, `ImpactRecord`.

---

### Proposal

| Field                 | Type             | Notes                                        |
| --------------------- | ---------------- | -------------------------------------------- |
| `id`                  | `String`         | UUID                                         |
| `challengeId`         | `String`         | FK → Challenge                               |
| `engineerId`          | `String`         | FK → User                                    |
| `diagnosis`           | `String`         | Min 50 chars — root-cause analysis           |
| `approach`            | `String`         | Min 100 chars — technical plan               |
| `expectedImprovement` | `Float`          | Predicted % improvement                      |
| `score`               | `Int?`           | LLM evaluation score (0-100)                 |
| `feedback`            | `String?`        | LLM-generated feedback text                  |
| `status`              | `ProposalStatus` | `"pending"` → `"shortlisted"` / `"rejected"` |
| `createdAt`           | `DateTime`       | Auto                                         |

**Unique constraint:** `(challengeId, engineerId)` — one proposal per engineer per challenge.

**Relations:** belongs to `Challenge` and `User` (engineer). Has one optional `Submission`.

---

### Submission

| Field               | Type               | Notes                                     |
| ------------------- | ------------------ | ----------------------------------------- |
| `id`                | `String`           | UUID                                      |
| `proposalId`        | `String`           | Unique FK → Proposal                      |
| `challengeId`       | `String`           | FK → Challenge                            |
| `engineerId`        | `String`           | FK → User                                 |
| `repoUrl`           | `String`           | GitHub repo URL                           |
| `achievedValue`     | `Float?`           | Measured metric after test                |
| `improvementDelta`  | `Float?`           | % improvement over baseline               |
| `constraintsPassed` | `Boolean?`         | Did solution respect constraints?         |
| `passed`            | `Boolean?`         | Did it meet the target?                   |
| `codeFingerprint`   | `String?`          | SHA-256 of normalised source              |
| `similarityScore`   | `Float?`           | Max similarity to prior submissions       |
| `integrityFlag`     | `Boolean`          | Default `false`. True = flagged           |
| `status`            | `SubmissionStatus` | `"pending"` → `"completed"` / `"flagged"` |
| `createdAt`         | `DateTime`         | Auto                                      |

**Relations:** belongs to `Proposal`, `Challenge`, `User`. Has one optional `ImpactRecord`.

---

### EngineerProfile

| Field              | Type       | Notes                 |
| ------------------ | ---------- | --------------------- |
| `engineerId`       | `String`   | PK, FK → User         |
| `totalSubmissions` | `Int`      | Default 0             |
| `totalPassed`      | `Int`      | Default 0             |
| `avgImprovement`   | `Float`    | Default 0             |
| `kpiScore`         | `Float`    | Composite score 0-100 |
| `updatedAt`        | `DateTime` | Auto                  |

Auto-created on engineer registration. Recalculated after every submission.

**KPI Score Formula:**

- 40% — pass rate (consistency)
- 40% — weighted average improvement (impact magnitude, difficulty-weighted: easy=1x, medium=1.5x, hard=2x)
- 20% — proposal acceptance rate (proposal quality signal)

---

### ImpactRecord

| Field              | Type       | Notes                  |
| ------------------ | ---------- | ---------------------- |
| `id`               | `String`   | UUID                   |
| `engineerId`       | `String`   | FK → User              |
| `challengeId`      | `String`   | FK → Challenge         |
| `submissionId`     | `String`   | Unique FK → Submission |
| `baselineValue`    | `Float`    |                        |
| `achievedValue`    | `Float`    |                        |
| `improvementDelta` | `Float`    | % change from baseline |
| `passed`           | `Boolean`  |                        |
| `integrityFlag`    | `Boolean`  | Default false          |
| `recordedAt`       | `DateTime` | Auto                   |

Both passes AND failures are recorded — this is the immutable credibility ledger.

---

## Enums

```
Role:             "engineer" | "company"
Vertical:         "frontend" | "backend" | "ml"
Difficulty:       "easy" | "medium" | "hard"
ChallengeSource:  "company" | "opensource"
ChallengeStatus:  "open" | "closed"
ProposalStatus:   "pending" | "shortlisted" | "rejected"
SubmissionStatus: "pending" | "completed" | "flagged"
```

---

## Authentication

- **Mechanism:** Bearer JWT in `Authorization` header
- **Token payload:** `{ userId, role, iat, exp }`
- **Default expiry:** 7 days
- **Middleware:** `authenticate` verifies token. `requireRole(role)` guards role-specific routes.
- **Registration:** Creates user + auto-creates `EngineerProfile` for engineer role.
- **Login:** Returns `{ user, token }`.

**Header format:**

```
Authorization: Bearer <jwt_token>
```

---

## API Endpoints

Base URL: `http://localhost:3000`

---

### Auth Routes

**Prefix:** `/api/auth`

#### `POST /api/auth/register`

**Access:** Public

**Request body:**

```json
{
  "email": "string (required)",
  "password": "string (required, min 8 chars)",
  "name": "string (required)",
  "role": "engineer | company (required)",
  "githubUrl": "string (optional)"
}
```

**Success response (201):**

```json
{
  "success": true,
  "message": "account created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "engineer",
      "githubUrl": null,
      "createdAt": "2026-02-28T..."
    },
    "token": "jwt_string"
  }
}
```

**Error codes:** `400` (validation), `409` (duplicate email)

---

#### `POST /api/auth/login`

**Access:** Public

**Request body:**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success response (200):**

```json
{
  "success": true,
  "message": "login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "engineer",
      "githubUrl": null,
      "createdAt": "2026-02-28T..."
    },
    "token": "jwt_string"
  }
}
```

**Error codes:** `400` (missing fields), `401` (bad credentials)

---

#### `GET /api/auth/me`

**Access:** Authenticated (any role)

**Headers:** `Authorization: Bearer <token>`

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "engineer",
      "githubUrl": null,
      "createdAt": "2026-02-28T...",
      "profile": {
        "engineerId": "uuid",
        "totalSubmissions": 5,
        "totalPassed": 3,
        "avgImprovement": 28.5,
        "kpiScore": 72.4,
        "updatedAt": "2026-02-28T..."
      }
    }
  }
}
```

`profile` is `null` for company users.

---

### Challenge Routes

**Prefix:** `/api/challenges`

#### `GET /api/challenges`

**Access:** Public

**Query params (all optional):**

| Param        | Values                             |
| ------------ | ---------------------------------- |
| `vertical`   | `frontend`, `backend`, `ml`        |
| `source`     | `company`, `opensource`            |
| `difficulty` | `easy`, `medium`, `hard`           |
| `status`     | `open`, `closed` (default: `open`) |

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "challenges": [
      {
        "id": "uuid",
        "postedById": "uuid",
        "title": "Reduce API p99 Latency",
        "description": "...",
        "vertical": "backend",
        "difficulty": "hard",
        "source": "company",
        "baselineValue": 320,
        "targetValue": 100,
        "comparisonOperator": "<=",
        "constraints": null,
        "repoUrl": null,
        "issueUrl": null,
        "status": "open",
        "createdAt": "2026-02-28T...",
        "postedBy": { "id": "uuid", "name": "Acme Corp" },
        "_count": { "proposals": 12, "submissions": 3 }
      }
    ]
  }
}
```

---

#### `GET /api/challenges/:id`

**Access:** Public (optionally reads Bearer token for engineer progress)

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "uuid",
      "title": "...",
      "description": "...",
      "vertical": "backend",
      "difficulty": "hard",
      "source": "company",
      "baselineValue": 320,
      "targetValue": 100,
      "comparisonOperator": "<=",
      "constraints": { "no_new_deps": true },
      "repoUrl": "https://github.com/...",
      "issueUrl": null,
      "status": "open",
      "createdAt": "...",
      "postedBy": { "id": "uuid", "name": "Acme Corp" },
      "_count": { "proposals": 12, "submissions": 3 }
    },
    "engineerProgress": {
      "id": "proposal-uuid",
      "status": "shortlisted",
      "score": 78,
      "createdAt": "...",
      "submission": {
        "id": "submission-uuid",
        "status": "completed",
        "passed": true,
        "achievedValue": 85,
        "improvementDelta": 73.44
      }
    }
  }
}
```

`engineerProgress` is `null` if user is not authenticated or hasn't submitted a proposal.

---

#### `POST /api/challenges`

**Access:** Authenticated, `company` role only

**Request body:**

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "vertical": "frontend | backend | ml (required)",
  "difficulty": "easy | medium | hard (required)",
  "source": "company | opensource (optional, default: company)",
  "baselineValue": "number (required)",
  "targetValue": "number (required)",
  "comparisonOperator": ">= | <= | > | < | == (required)",
  "constraints": "object (optional)",
  "repoUrl": "string (optional)",
  "issueUrl": "string (required if source=opensource)"
}
```

**Validation rules:**

- `targetValue` must represent an improvement over `baselineValue` for the given operator
- For `>=` / `>`: target > baseline
- For `<=` / `<`: target < baseline

**Success response (201):**

```json
{
  "success": true,
  "message": "challenge created successfully",
  "data": {
    "challenge": { "...full challenge object with postedBy..." }
  }
}
```

---

#### `PATCH /api/challenges/:id/status`

**Access:** Authenticated, `company` role only, must own the challenge

**Request body:**

```json
{
  "status": "open | closed"
}
```

**Success response (200):**

```json
{
  "success": true,
  "message": "challenge closed successfully",
  "data": { "challenge": { "..." } }
}
```

---

#### `GET /api/challenges/company/my`

**Access:** Authenticated, `company` role only

Returns all challenges posted by this company with proposal/submission counts and passing submission count.

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "challenges": [
      {
        "id": "uuid",
        "title": "...",
        "status": "open",
        "createdAt": "...",
        "_count": { "proposals": 12, "submissions": 3 },
        "passedSubmissionsCount": 2
      }
    ]
  }
}
```

---

#### `GET /api/challenges/:id/leaderboard`

**Access:** Public

Returns top 10 passing (non-flagged) submissions for a challenge, ordered by improvement delta.

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "uuid",
      "title": "...",
      "vertical": "backend",
      "baselineValue": 320,
      "targetValue": 100
    },
    "leaderboard": [
      {
        "id": "submission-uuid",
        "achievedValue": 72,
        "improvementDelta": 77.5,
        "constraintsPassed": true,
        "createdAt": "...",
        "engineer": {
          "id": "uuid",
          "name": "Jane Doe",
          "githubUrl": "https://github.com/janedoe"
        },
        "proposal": {
          "score": 82,
          "expectedImprovement": 60
        }
      }
    ]
  }
}
```

---

### Proposal Routes

**Prefix:** `/api/proposals`

#### `POST /api/proposals`

**Access:** Authenticated, `engineer` role only

**Request body:**

```json
{
  "challengeId": "uuid (required)",
  "diagnosis": "string (required, min 50 chars)",
  "approach": "string (required, min 100 chars)",
  "expectedImprovement": "number > 0 (required, represents %)"
}
```

**Behaviour:** Creates proposal in `"pending"` state. Triggers async LLM evaluation via Claude. Client should poll `GET /api/proposals/:id/status` for results.

**LLM Evaluation:** Scores 0-100 across three criteria:

- Diagnosis Quality (0-33)
- Technical Approach Feasibility (0-34)
- Constraint Awareness (0-33)

**Shortlist threshold:** score ≥ 65 → `"shortlisted"`, otherwise `"rejected"`.

**Success response (201):**

```json
{
  "success": true,
  "message": "proposal submitted — evaluation is running",
  "data": { "proposalId": "uuid", "status": "pending" }
}
```

**Error codes:** `400` (validation), `404` (challenge not found), `409` (already submitted)

---

#### `GET /api/proposals/:id`

**Access:** Authenticated, `engineer` role only (own proposals only)

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "proposal": {
      "id": "uuid",
      "challengeId": "uuid",
      "engineerId": "uuid",
      "diagnosis": "...",
      "approach": "...",
      "expectedImprovement": 30,
      "score": 78,
      "feedback": "Strong diagnosis identifying the N+1 query...",
      "status": "shortlisted",
      "createdAt": "...",
      "challenge": {
        "id": "uuid",
        "title": "...",
        "vertical": "backend",
        "difficulty": "hard",
        "baselineValue": 320,
        "targetValue": 100,
        "comparisonOperator": "<=",
        "constraints": null,
        "repoUrl": null
      },
      "submission": {
        "id": "uuid",
        "status": "completed",
        "passed": true,
        "achievedValue": 85,
        "improvementDelta": 73.44,
        "constraintsPassed": true,
        "integrityFlag": false
      }
    }
  }
}
```

---

#### `GET /api/proposals/:id/status`

**Access:** Authenticated, `engineer` role only (own proposals only)

Lightweight polling endpoint. Returns only status and scores.

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "shortlisted",
    "score": 78,
    "feedback": "..."
  }
}
```

---

#### `GET /api/proposals/my`

**Access:** Authenticated, `engineer` role only

Returns all proposals by the current engineer with challenge info and submission status.

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": "uuid",
        "challengeId": "uuid",
        "engineerId": "uuid",
        "diagnosis": "...",
        "approach": "...",
        "expectedImprovement": 30,
        "score": 78,
        "feedback": "...",
        "status": "shortlisted",
        "createdAt": "...",
        "challenge": {
          "id": "uuid",
          "title": "...",
          "vertical": "backend",
          "difficulty": "hard",
          "baselineValue": 320,
          "targetValue": 100,
          "comparisonOperator": "<=",
          "status": "open"
        },
        "submission": {
          "id": "uuid",
          "status": "completed",
          "passed": true,
          "improvementDelta": 73.44
        }
      }
    ]
  }
}
```

---

#### `GET /api/proposals/challenge/:challengeId`

**Access:** Authenticated, `company` role only (must own the challenge)

Returns all proposals for a challenge the company posted, with engineer profiles and aggregated stats.

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "challenge": { "id": "uuid", "title": "...", "postedById": "uuid" },
    "proposals": [
      {
        "id": "uuid",
        "diagnosis": "...",
        "approach": "...",
        "expectedImprovement": 30,
        "score": 78,
        "feedback": "...",
        "status": "shortlisted",
        "createdAt": "...",
        "engineer": {
          "id": "uuid",
          "name": "Jane Doe",
          "githubUrl": "...",
          "profile": {
            "kpiScore": 72.4,
            "totalPassed": 5,
            "avgImprovement": 28.5
          }
        },
        "submission": {
          "id": "uuid",
          "passed": true,
          "achievedValue": 85,
          "improvementDelta": 73.44,
          "status": "completed"
        }
      }
    ],
    "stats": {
      "total": 12,
      "shortlisted": 4,
      "rejected": 6,
      "pending": 2,
      "avgScore": 61.3
    }
  }
}
```

---

### Submission Routes

**Prefix:** `/api/submissions`

**All submission routes require:** Authenticated + `engineer` role

#### `POST /api/submissions`

**Request body:**

```json
{
  "challengeId": "uuid (required)",
  "repoUrl": "string (required, must start with https://github.com/)"
}
```

**Prerequisites:**

- Challenge must be `"open"`
- Engineer must have a `"shortlisted"` proposal for this challenge
- No existing submission for the same proposal

**Behaviour:** Creates submission in `"pending"` state. Triggers async pipeline:

1. Runs automated tests (Lighthouse for frontend, autocannon for backend, Python eval for ML)
2. Integrity checks (code fingerprint comparison, proposal-to-outcome consistency)
3. Scores and updates submission
4. Creates ImpactRecord
5. Recalculates EngineerProfile

Client should poll `GET /api/submissions/:id/status`.

**Success response (201):**

```json
{
  "success": true,
  "message": "submission received — test pipeline is running",
  "data": { "submissionId": "uuid", "status": "pending" }
}
```

**Error codes:** `400` (validation), `403` (no shortlisted proposal), `404` (challenge gone), `409` (already submitted)

---

#### `GET /api/submissions/:id`

Full submission detail with challenge info, proposal info, and impact record.

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "uuid",
      "proposalId": "uuid",
      "challengeId": "uuid",
      "engineerId": "uuid",
      "repoUrl": "https://github.com/...",
      "achievedValue": 85,
      "improvementDelta": 73.44,
      "constraintsPassed": true,
      "passed": true,
      "codeFingerprint": "abc123...",
      "similarityScore": 0.12,
      "integrityFlag": false,
      "status": "completed",
      "createdAt": "...",
      "challenge": {
        "id": "uuid",
        "title": "...",
        "vertical": "backend",
        "difficulty": "hard",
        "baselineValue": 320,
        "targetValue": 100,
        "comparisonOperator": "<=",
        "constraints": null
      },
      "proposal": {
        "id": "uuid",
        "expectedImprovement": 30,
        "score": 78,
        "feedback": "..."
      },
      "impactRecord": {
        "id": "uuid",
        "baselineValue": 320,
        "achievedValue": 85,
        "improvementDelta": 73.44,
        "passed": true,
        "integrityFlag": false,
        "recordedAt": "..."
      }
    }
  }
}
```

---

#### `GET /api/submissions/:id/status`

Lightweight polling endpoint.

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "passed": true,
    "achievedValue": 85,
    "improvementDelta": 73.44,
    "constraintsPassed": true,
    "integrityFlag": false
  }
}
```

---

#### `GET /api/submissions/my`

All submissions by the current engineer.

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "uuid",
        "proposalId": "uuid",
        "challengeId": "uuid",
        "repoUrl": "https://github.com/...",
        "achievedValue": 85,
        "improvementDelta": 73.44,
        "constraintsPassed": true,
        "passed": true,
        "integrityFlag": false,
        "status": "completed",
        "createdAt": "...",
        "challenge": {
          "id": "uuid",
          "title": "...",
          "vertical": "backend",
          "difficulty": "hard",
          "baselineValue": 320,
          "targetValue": 100
        },
        "impactRecord": {
          "improvementDelta": 73.44,
          "passed": true,
          "recordedAt": "..."
        }
      }
    ]
  }
}
```

---

### Profile Routes

**Prefix:** `/api/profile`

> **NOTE:** These routes are NOT mounted in `server.js` yet. The route file exists at `src/routes/profileRoutes.js` and the controller at `src/controllers/profileController.js`. You'll need to register them: `app.use("/api/profile", profileRoutes)` and import the proposal routes as well: `app.use("/api/proposals", proposalRoutes)`.

#### `GET /api/profile/me`

**Access:** Authenticated, `engineer` role only

Returns the engineer's full private profile: user info, aggregated stats, all impact records, proposal summary, per-vertical breakdown, and recent activity.

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "githubUrl": "https://github.com/janedoe",
      "createdAt": "..."
    },
    "profile": {
      "engineerId": "uuid",
      "totalSubmissions": 8,
      "totalPassed": 5,
      "avgImprovement": 28.5,
      "kpiScore": 72.4,
      "updatedAt": "..."
    },
    "impactRecords": [
      {
        "id": "uuid",
        "challengeId": "uuid",
        "baselineValue": 320,
        "achievedValue": 85,
        "improvementDelta": 73.44,
        "passed": true,
        "integrityFlag": false,
        "recordedAt": "...",
        "challenge": {
          "id": "uuid",
          "title": "Reduce p99 Latency",
          "vertical": "backend",
          "difficulty": "hard",
          "comparisonOperator": "<="
        }
      }
    ],
    "proposalSummary": {
      "total": 15,
      "shortlisted": 8,
      "rejected": 5,
      "pending": 2,
      "acceptanceRate": 53.3
    },
    "verticalBreakdown": {
      "frontend": {
        "attempted": 3,
        "passed": 2,
        "passRate": 66.7,
        "avgImprovement": 21.5
      },
      "backend": {
        "attempted": 4,
        "passed": 3,
        "passRate": 75.0,
        "avgImprovement": 34.2
      },
      "ml": { "attempted": 1, "passed": 0, "passRate": 0, "avgImprovement": 0 }
    },
    "recentActivity": [
      {
        "challengeId": "uuid",
        "challengeTitle": "...",
        "vertical": "backend",
        "difficulty": "hard",
        "passed": true,
        "improvementDelta": 73.44,
        "integrityFlag": false,
        "recordedAt": "..."
      }
    ]
  }
}
```

---

#### `GET /api/profile/me/proposals`

**Access:** Authenticated, `engineer` role only

Full proposal history with challenge context and submission outcomes. Powers "My Activity" tab.

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": "uuid",
        "diagnosis": "...",
        "approach": "...",
        "expectedImprovement": 30,
        "score": 78,
        "feedback": "...",
        "status": "shortlisted",
        "createdAt": "...",
        "challenge": {
          "id": "uuid",
          "title": "...",
          "vertical": "backend",
          "difficulty": "hard",
          "baselineValue": 320,
          "targetValue": 100,
          "comparisonOperator": "<=",
          "status": "open"
        },
        "submission": {
          "id": "uuid",
          "status": "completed",
          "passed": true,
          "achievedValue": 85,
          "improvementDelta": 73.44,
          "constraintsPassed": true,
          "integrityFlag": false,
          "createdAt": "..."
        }
      }
    ]
  }
}
```

---

#### `GET /api/profile/discover`

**Access:** Authenticated, `company` role only

Search and filter engineers for reverse recruiting.

**Query params:**

| Param               | Type   | Description                                                               |
| ------------------- | ------ | ------------------------------------------------------------------------- |
| `minKpi`            | number | Minimum KPI score                                                         |
| `minAvgImprovement` | number | Minimum average improvement %                                             |
| `minTotalPassed`    | number | Minimum total passed submissions                                          |
| `vertical`          | string | Filter by vertical strength                                               |
| `sortBy`            | string | `kpiScore` (default), `avgImprovement`, `totalPassed`, `totalSubmissions` |
| `order`             | string | `desc` (default) or `asc`                                                 |
| `page`              | number | Page number (default: 1)                                                  |
| `limit`             | number | Items per page (default: 20, max: 50)                                     |

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "engineers": [
      {
        "engineerId": "uuid",
        "totalSubmissions": 8,
        "totalPassed": 5,
        "avgImprovement": 28.5,
        "kpiScore": 72.4,
        "updatedAt": "...",
        "engineer": {
          "id": "uuid",
          "name": "Jane Doe",
          "githubUrl": "https://github.com/janedoe",
          "createdAt": "..."
        },
        "topImpactRecords": [
          {
            "id": "uuid",
            "improvementDelta": 73.44,
            "passed": true,
            "challenge": {
              "title": "...",
              "vertical": "backend",
              "difficulty": "hard"
            }
          }
        ]
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

#### `GET /api/profile/:engineerId`

**Access:** Public

Public credibility ledger for an engineer. Flagged records are hidden. Company profiles return 404.

**Success response (200):** Same shape as `GET /api/profile/me` but without email, and only non-flagged impact records.

---

## Services (Internal)

These are NOT exposed as API endpoints — they are used internally by controllers.

### `llmService.js` — Proposal Evaluation

- Uses Anthropic Claude (`claude-sonnet-4-20250514`)
- Evaluates proposals on: Diagnosis Quality (0-33), Technical Feasibility (0-34), Constraint Awareness (0-33)
- Returns `{ score: 0-100, feedback: string, error: string|null }`
- Shortlist threshold: 65

### `scoringService.js` — Code Fingerprinting & KPI

- `computeCodeFingerprint(repoUrl)`: Clones repo, hashes normalised source files (SHA-256)
- `checkSimilarity(fpA, fpB)`: Returns 0.0-1.0. Flag threshold: >0.85
- `computeKpiScore({ passRate, avgImprovementDelta, proposalAcceptanceRate, difficulty })`: Computes weighted KPI

### `testRunner.js` — Automated Testing

- `runTestPipeline(params)`: Dispatches to vertical-specific runners
  - **Frontend:** Lighthouse CI — returns performance score (0-100)
  - **Backend:** autocannon load test — returns p99 latency in ms
  - **ML:** Python eval script — returns `metric_value` from `eval_result.json`
- Returns `{ achievedValue, constraintsPassed, passed, error }`

---

## Response Envelope

All API responses follow this shape:

```json
{
  "success": true | false,
  "message": "optional human-readable message",
  "data": { ... }
}
```

- `success: true` — request completed normally
- `success: false` — always includes `message` explaining the error

**Standard HTTP status codes used:**

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | OK                                      |
| 201  | Created                                 |
| 400  | Bad request / validation error          |
| 401  | Unauthorized (missing or invalid token) |
| 403  | Forbidden (wrong role or not owner)     |
| 404  | Resource not found                      |
| 409  | Conflict (duplicate resource)           |
| 500  | Internal server error                   |

---

## Role-Based Access Summary

| Endpoint                              | Public | Engineer | Company |
| ------------------------------------- | ------ | -------- | ------- |
| `POST /api/auth/register`             | ✅     | ✅       | ✅      |
| `POST /api/auth/login`                | ✅     | ✅       | ✅      |
| `GET /api/auth/me`                    |        | ✅       | ✅      |
| `GET /api/challenges`                 | ✅     | ✅       | ✅      |
| `GET /api/challenges/:id`             | ✅     | ✅       | ✅      |
| `GET /api/challenges/:id/leaderboard` | ✅     | ✅       | ✅      |
| `POST /api/challenges`                |        |          | ✅      |
| `PATCH /api/challenges/:id/status`    |        |          | ✅      |
| `GET /api/challenges/company/my`      |        |          | ✅      |
| `POST /api/proposals`                 |        | ✅       |         |
| `GET /api/proposals/:id`              |        | ✅       |         |
| `GET /api/proposals/:id/status`       |        | ✅       |         |
| `GET /api/proposals/my`               |        | ✅       |         |
| `GET /api/proposals/challenge/:id`    |        |          | ✅      |
| `POST /api/submissions`               |        | ✅       |         |
| `GET /api/submissions/:id`            |        | ✅       |         |
| `GET /api/submissions/:id/status`     |        | ✅       |         |
| `GET /api/submissions/my`             |        | ✅       |         |
| `GET /api/profile/me`                 |        | ✅       |         |
| `GET /api/profile/me/proposals`       |        | ✅       |         |
| `GET /api/profile/discover`           |        |          | ✅      |
| `GET /api/profile/:engineerId`        | ✅     | ✅       | ✅      |

---

## User Flows

### Engineer Flow

1. **Register** as `engineer` → auto-creates empty profile
2. **Browse challenges** → filter by vertical, difficulty
3. **View challenge detail** → see baseline/target metrics, constraints
4. **Submit proposal** → write diagnosis + approach → LLM evaluates async
5. **Poll proposal status** → wait for `shortlisted` or `rejected`
6. **If shortlisted:** submit solution repo URL
7. **Poll submission status** → automated tests run async
8. **View results** → see achieved value, improvement delta, pass/fail
9. **Impact record created** → permanently recorded on ledger
10. **Profile auto-updates** → KPI score recalculated
11. **View profile** → see stats, vertical breakdown, recent activity
12. **Public profile** → shareable credibility ledger

### Company Flow

1. **Register** as `company`
2. **Create challenges** → define metrics, baselines, targets, constraints
3. **View own challenges** → see proposal/submission counts
4. **View proposals** for each challenge → see LLM scores, engineer profiles
5. **View leaderboard** → top performing engineers per challenge
6. **Discover engineers** → search/filter by KPI, vertical, improvement
7. **View engineer profiles** → verified impact records
8. **Close challenges** when satisfied

---

## File Tree

```
backend/
├── package.json                          # Dependencies & scripts
├── pnpm-lock.yaml                        # Lock file
├── prisma.config.ts                      # Prisma config (datasource URL)
├── prisma/
│   ├── schema.prisma                     # Data models, enums, relations
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20260227213947_init/
│           └── migration.sql             # Initial DDL
├── src/
│   ├── server.js                         # Express app setup, CORS, route mounting, error handling
│   ├── lib/
│   │   └── prisma.js                     # Prisma client singleton (pg adapter)
│   ├── middleware/
│   │   └── authMiddleware.js             # JWT authenticate + requireRole guards
│   ├── routes/
│   │   ├── authRoutes.js                 # POST register, POST login, GET me
│   │   ├── challengesRoutes.js           # CRUD challenges, leaderboard
│   │   ├── profileRoutes.js              # Profile me, discover, public profile
│   │   ├── proposalRoutes.js             # CRUD proposals, challenge proposals
│   │   └── submissionRoutes.js           # CRUD submissions
│   ├── controllers/
│   │   ├── authController.js             # register, login, me
│   │   ├── challengesController.js       # getChallenges, getById, create, updateStatus, getMy, leaderboard
│   │   ├── profileController.js          # getMyProfile, getPublicProfile, discoverEngineers, getMyProposalHistory
│   │   ├── proposalController.js         # createProposal, getById, getStatus, getMy, getForChallenge + LLM eval pipeline
│   │   └── submissionController.js       # createSubmission, getById, getStatus, getMy + test/integrity pipeline
│   ├── services/
│   │   ├── llmService.js                 # Claude API evaluation (score 0-100 + feedback)
│   │   ├── scoringService.js             # Code fingerprinting, similarity check, KPI score
│   │   └── testRunner.js                 # Lighthouse, autocannon, Python eval runners
│   └── generated/
│       └── prisma/                       # Auto-generated Prisma client (do not edit)
└── frontend/                             # (empty — to be built)
```

---

## Important Notes for Frontend Implementation

1. **Missing route registrations in `server.js`:** The profile and proposal routes exist but only auth, submissions, and challenges are mounted. You need to add:

   ```js
   import profileRoutes from "./routes/profileRoutes.js";
   import proposalRoutes from "./routes/proposalRoutes.js";

   app.use("/api/profile", profileRoutes);
   app.use("/api/proposals", proposalRoutes);
   ```

2. **Polling pattern:** Proposals and submissions use async processing. After `POST`, poll the `/status` endpoint every 2-3 seconds until `status !== "pending"`.

3. **Token storage:** Store JWT in `localStorage` or a secure cookie. Include in all authenticated requests as `Authorization: Bearer <token>`.

4. **Two distinct UI surfaces:**
   - **Engineer dashboard:** Browse challenges → submit proposals → submit solutions → view profile/impact ledger
   - **Company dashboard:** Create challenges → view proposals → view leaderboards → discover/recruit engineers

5. **CORS:** Backend is configured for `http://localhost:5173` (Vite default).


frontend/
└── src/
    ├── app/
    │   ├── router.tsx
    │   └── providers.tsx
    │
    ├── api/
    │   ├── auth.api.ts
    │   ├── challenges.api.ts
    │   ├── proposals.api.ts
    │   ├── submissions.api.ts
    │   └── profile.api.ts
    │
    ├── types/
    │   ├── auth.types.ts
    │   ├── challenge.types.ts
    │   ├── proposal.types.ts
    │   ├── submission.types.ts
    │   ├── profile.types.ts
    │   └── api.types.ts
    │
    ├── features/
    │   ├── auth/
    │   ├── challenges/
    │   ├── proposals/
    │   ├── submissions/
    │   ├── profile/
    │   └── dashboard/
    │
    ├── components/
    │   ├── ui/
    │   └── layout/
    │
    ├── hooks/
    ├── context/
    ├── lib/
    └── styles/

we following this