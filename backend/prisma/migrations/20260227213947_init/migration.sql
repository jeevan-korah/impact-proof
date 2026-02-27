-- CreateEnum
CREATE TYPE "Role" AS ENUM ('engineer', 'company');

-- CreateEnum
CREATE TYPE "Vertical" AS ENUM ('frontend', 'backend', 'ml');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "ChallengeSource" AS ENUM ('company', 'opensource');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('pending', 'shortlisted', 'rejected');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'completed', 'flagged');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "githubUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "postedById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vertical" "Vertical" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "source" "ChallengeSource" NOT NULL,
    "baselineValue" DOUBLE PRECISION NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "comparisonOperator" TEXT NOT NULL,
    "constraints" JSONB,
    "repoUrl" TEXT,
    "issueUrl" TEXT,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "expectedImprovement" DOUBLE PRECISION NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "achievedValue" DOUBLE PRECISION,
    "improvementDelta" DOUBLE PRECISION,
    "constraintsPassed" BOOLEAN,
    "passed" BOOLEAN,
    "codeFingerprint" TEXT,
    "similarityScore" DOUBLE PRECISION,
    "integrityFlag" BOOLEAN NOT NULL DEFAULT false,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineerProfile" (
    "engineerId" TEXT NOT NULL,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "totalPassed" INTEGER NOT NULL DEFAULT 0,
    "avgImprovement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kpiScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineerProfile_pkey" PRIMARY KEY ("engineerId")
);

-- CreateTable
CREATE TABLE "ImpactRecord" (
    "id" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "baselineValue" DOUBLE PRECISION NOT NULL,
    "achievedValue" DOUBLE PRECISION NOT NULL,
    "improvementDelta" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "integrityFlag" BOOLEAN NOT NULL DEFAULT false,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpactRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_challengeId_engineerId_key" ON "Proposal"("challengeId", "engineerId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_proposalId_key" ON "Submission"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactRecord_submissionId_key" ON "ImpactRecord"("submissionId");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineerProfile" ADD CONSTRAINT "EngineerProfile_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactRecord" ADD CONSTRAINT "ImpactRecord_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactRecord" ADD CONSTRAINT "ImpactRecord_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactRecord" ADD CONSTRAINT "ImpactRecord_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
