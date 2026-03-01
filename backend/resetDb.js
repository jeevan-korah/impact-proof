// resetDb.js - Clear submissions, proposals, challenges and reseed
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client.ts";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function reset() {
  console.log("🧹 Resetting database...\n");

  // Delete in order (respecting foreign key constraints)
  console.log("Deleting submissions...");
  const deletedSubmissions = await prisma.submission.deleteMany({});
  console.log(`  ✅ Deleted ${deletedSubmissions.count} submissions`);

  console.log("Deleting proposals...");
  const deletedProposals = await prisma.proposal.deleteMany({});
  console.log(`  ✅ Deleted ${deletedProposals.count} proposals`);

  console.log("Deleting challenges...");
  const deletedChallenges = await prisma.challenge.deleteMany({});
  console.log(`  ✅ Deleted ${deletedChallenges.count} challenges`);

  console.log("Deleting engineer profiles...");
  const deletedProfiles = await prisma.engineerProfile.deleteMany({});
  console.log(`  ✅ Deleted ${deletedProfiles.count} profiles`);

  console.log("\n🌱 Reseeding database...\n");

  // Create a company user
  const companyPassword = await bcrypt.hash("password123", 12);
  const company = await prisma.user.upsert({
    where: { email: "company@test.com" },
    update: {},
    create: {
      email: "company@test.com",
      passwordHash: companyPassword,
      name: "TestCorp",
      role: "company",
    },
  });
  console.log("✅ Company user:", company.email);

  // Create an engineer user
  const engineerPassword = await bcrypt.hash("password123", 12);
  const engineer = await prisma.user.upsert({
    where: { email: "engineer@test.com" },
    update: {},
    create: {
      email: "engineer@test.com",
      passwordHash: engineerPassword,
      name: "Test Engineer",
      role: "engineer",
      githubUrl: "https://github.com/testuser",
    },
  });
  console.log("✅ Engineer user:", engineer.email);

  // Create ML Challenge
  const mlChallenge = await prisma.challenge.create({
    data: {
      postedById: company.id,
      title: "ML Model Accuracy Increase to 90% (OpenAI)",
      description:
        "Improve a classification model's accuracy from 78% to at least 90% while maintaining inference latency under 200ms.",
      vertical: "ml",
      difficulty: "medium",
      source: "company",
      baselineValue: 78.0,
      targetValue: 90.0,
      comparisonOperator: ">=",
      checklist: [
        "Proposal includes specific data augmentation techniques",
        "Model architecture is clearly defined",
        "Hyperparameter tuning strategy is detailed",
        "Training time constraints are addressed (under 800 seconds)",
        "Inference latency optimization is mentioned",
        "Expected accuracy improvement is quantified",
        "Risk mitigation for overfitting is included",
      ],
      threshold: 70.0,
      constraints: {
        maxTrainingTime: 800,
        maxInferenceLatency: 200,
        minAccuracy: 90,
      },
      status: "open",
    },
  });
  console.log("✅ ML Challenge:", mlChallenge.title);

  // Create Backend Challenge
  const backendChallenge = await prisma.challenge.create({
    data: {
      postedById: company.id,
      title: "Reduce Payment Transaction Latency to <200ms",
      description:
        "Optimize the legacy payment microservice to reduce average transaction latency from 450ms to under 200ms while maintaining zero transaction failures.",
      vertical: "backend",
      difficulty: "hard",
      source: "company",
      baselineValue: 450.0,
      targetValue: 200.0,
      comparisonOperator: "<=",
      checklist: [
        "Database query optimization strategy is detailed",
        "Caching implementation plan is included",
        "Async processing approach is specified",
        "Code refactoring areas are identified",
        "Load testing methodology is defined",
        "P99 latency target is addressed",
        "Zero downtime deployment plan is mentioned",
      ],
      threshold: 65.0,
      constraints: {
        maxLatency: 200,
        minUptime: 99.9,
        zeroDataLoss: true,
      },
      status: "open",
    },
  });
  console.log("✅ Backend Challenge:", backendChallenge.title);

  // Create Frontend Challenge
  const frontendChallenge = await prisma.challenge.create({
    data: {
      postedById: company.id,
      title: "Improve Lighthouse Score from 58 to ≥80",
      description:
        "Optimize the web application to improve the Lighthouse performance score from 58 to at least 80.",
      vertical: "frontend",
      difficulty: "medium",
      source: "company",
      baselineValue: 58.0,
      targetValue: 80.0,
      comparisonOperator: ">=",
      checklist: [
        "Code splitting strategy is explained",
        "Image optimization techniques are specified",
        "CSS optimization approach is detailed",
        "JavaScript bundle size reduction plan is included",
        "Caching strategy is mentioned",
        "First Contentful Paint target is addressed",
        "Time to Interactive improvement is quantified",
      ],
      threshold: 70.0,
      constraints: {
        maxBundleSize: 300,
        maxFCP: 1.2,
        maxTTI: 2.5,
      },
      status: "open",
    },
  });
  console.log("✅ Frontend Challenge:", frontendChallenge.title);

  // Create ML Challenge - Claude Sonnet
  const claudeChallenge = await prisma.challenge.create({
    data: {
      postedById: company.id,
      title: "Increase Claude Sonnet Model Performance",
      description:
        "Enhance the Claude Sonnet model's benchmark performance score from 72% to at least 92% across reasoning, coding, and multi-step task completion benchmarks while keeping inference cost under $0.015 per 1K tokens and response latency under 3 seconds.",
      vertical: "ml",
      difficulty: "hard",
      source: "company",
      baselineValue: 72.0,
      targetValue: 92.0,
      comparisonOperator: ">=",
      checklist: [
        "Fine-tuning strategy with RLHF / DPO methodology is detailed",
        "Training data curation and quality filtering pipeline is specified",
        "Reasoning benchmark improvement plan (MMLU, GSM8K, HumanEval) is included",
        "Cost-efficiency analysis for inference optimization is provided",
        "Latency optimization approach (quantization, distillation) is explained",
        "Evaluation harness and A/B testing methodology is defined",
        "Safety and alignment guardrails are maintained post-improvement",
      ],
      threshold: 70.0,
      constraints: {
        maxInferenceCostPer1K: 0.015,
        maxResponseLatency: 3000,
        minBenchmarkScore: 92,
      },
      status: "open",
    },
  });
  console.log("✅ Claude Sonnet Challenge:", claudeChallenge.title);

  // Create Fraud Detection Challenge
  const fraudChallenge = await prisma.challenge.create({
    data: {
      postedById: company.id,
      title: "Fraud Detection Model: Reduce False Positives",
      description:
        "Improve fraud detection model to reduce false positive rate from 12% to under 3% while maintaining 99.5% detection accuracy for actual fraud cases.",
      vertical: "ml",
      difficulty: "hard",
      source: "company",
      baselineValue: 12.0,
      targetValue: 3.0,
      comparisonOperator: "<=",
      checklist: [
        "Feature engineering approach for transaction patterns is detailed",
        "Model ensemble strategy is specified",
        "Imbalanced dataset handling technique is explained",
        "Real-time inference requirements (under 100ms) are addressed",
        "Precision-recall tradeoff analysis is included",
        "Model interpretability for compliance is mentioned",
        "A/B testing plan with risk mitigation is provided",
      ],
      threshold: 70.0,
      constraints: {
        maxFalsePositiveRate: 3.0,
        minTruePositiveRate: 99.5,
        maxInferenceLatency: 100,
      },
      status: "open",
    },
  });
  console.log("✅ Fraud Detection Challenge:", fraudChallenge.title);

  // Create Database Query Optimization Challenge
  const dbChallenge = await prisma.challenge.create({
    data: {
      postedById: company.id,
      title: "Optimize Database Query Performance",
      description:
        "Optimize critical database queries to reduce P95 response time from 850ms to under 150ms for the user analytics dashboard.",
      vertical: "backend",
      difficulty: "medium",
      source: "company",
      baselineValue: 850.0,
      targetValue: 150.0,
      comparisonOperator: "<=",
      checklist: [
        "Index optimization strategy is detailed",
        "Query execution plan analysis is included",
        "Denormalization approach is specified where applicable",
        "Caching layer design is explained",
        "Connection pooling configuration is addressed",
        "Query batching or aggregation strategy is mentioned",
        "Performance testing methodology is defined",
      ],
      threshold: 70.0,
      constraints: {
        maxP95Latency: 150,
        noDataIntegrityLoss: true,
        zeroDowntime: true,
      },
      status: "open",
    },
  });
  console.log("✅ Database Query Challenge:", dbChallenge.title);

  console.log("\n🎉 Reset and reseed complete!");
  console.log("\n📝 Test Accounts:");
  console.log("Company: company@test.com / password123");
  console.log("Engineer: engineer@test.com / password123");
  console.log("\n📊 Created 6 fresh challenges:");
  console.log("  • ML Model Accuracy (OpenAI)");
  console.log("  • Payment Latency Reduction");
  console.log("  • Lighthouse Score Improvement");
  console.log("  • Claude Sonnet Performance");
  console.log("  • Fraud Detection Optimization");
  console.log("  • Database Query Optimization");
  console.log("\n🚀 Ready to test proposals and quiz generation!");
}

reset()
  .catch((e) => {
    console.error("❌ Reset failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
