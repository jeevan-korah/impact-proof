// seed.js - Add test challenges to database
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client.ts";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("🌱 Seeding database...");

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
  console.log("✅ Company user created:", company.email);

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
  console.log("✅ Engineer user created:", engineer.email);

  // Create ML Challenge
  const mlChallenge = await prisma.challenge.create({
    data: {
      postedById: company.id,
      title: "ML Model Accuracy Increase to 90% (OpenAI)",
      description: "Improve a classification model's accuracy from 78% to at least 90% while maintaining inference latency under 200ms.",
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
  console.log("✅ ML Challenge created:", mlChallenge.id);

  // Create Backend Challenge
  const backendChallenge = await prisma.challenge.create({
    data: {
      postedById: company.id,
      title: "Reduce Payment Transaction Latency to <200ms",
      description: "Optimize the legacy payment microservice to reduce average transaction latency from 450ms to under 200ms while maintaining zero transaction failures.",
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
  console.log("✅ Backend Challenge created:", backendChallenge.id);

  // Create Frontend Challenge
  const frontendChallenge = await prisma.challenge.create({
    data: {
      postedById: company.id,
      title: "Improve Lighthouse Score from 58 to ≥80",
      description: "Optimize the web application to improve the Lighthouse performance score from 58 to at least 80.",
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
  console.log("✅ Frontend Challenge created:", frontendChallenge.id);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📝 Test Accounts:");
  console.log("Company: company@test.com / password123");
  console.log("Engineer: engineer@test.com / password123");
  console.log("\n🚀 You can now:");
  console.log("1. Login as engineer@test.com");
  console.log("2. Browse challenges on dashboard");
  console.log("3. Submit proposals to challenges");
  console.log("4. View proposals at /proposals");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
