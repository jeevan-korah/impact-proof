// src/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { email, password, name, role, githubUrl } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: "email, password, name, and role are required",
      });
    }

    if (!["engineer", "company"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role must be either "engineer" or "company"',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "password must be at least 8 characters",
      });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "an account with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        githubUrl: githubUrl || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        githubUrl: true,
        createdAt: true,
      },
    });

    // If engineer, create an empty profile immediately
    if (role === "engineer") {
      await prisma.engineerProfile.create({
        data: { engineerId: user.id },
      });
    }

    const token = generateToken(user.id, user.role);

    return res.status(201).json({
      success: true,
      message: "account created successfully",
      data: { user, token },
    });
  } catch (error) {
    console.error("[register]", error);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    // Find user (include passwordHash this time)
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "invalid email or password",
      });
    }

    const token = generateToken(user.id, user.role);

    // Strip passwordHash before sending
    const { passwordHash: _, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: "login successful",
      data: { user: safeUser, token },
    });
  } catch (error) {
    console.error("[login]", error);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// GET /api/auth/me
export const me = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        githubUrl: true,
        createdAt: true,
        profile: true, // includes EngineerProfile if engineer
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("[me]", error);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
