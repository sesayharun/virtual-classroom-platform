import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const publicRoles = new Set(["student", "teacher"]);

function validationErrors(req) {
  const result = validationResult(req);
  return result.isEmpty()
    ? null
    : result.array().map(({ path, msg }) => ({ field: path, message: msg }));
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );
}

router.post(
  "/register",
  [
    body("fullName").trim().isLength({ min: 2, max: 120 }).withMessage("Full name must contain 2 to 120 characters."),
    body("email").trim().isEmail().normalizeEmail().withMessage("Enter a valid email address."),
    body("password").isLength({ min: 8, max: 72 }).withMessage("Password must contain 8 to 72 characters."),
    body("role").isIn(["student", "teacher"]).withMessage("Choose student or teacher."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationErrors(req);
      if (errors) return res.status(400).json({ message: "Please correct the form.", errors });

      const { fullName, email, password, role } = req.body;
      if (!publicRoles.has(role)) {
        return res.status(400).json({ message: "Invalid public registration role." });
      }

      const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
      if (existing.length) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [result] = await pool.execute(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [fullName, email, passwordHash, role],
      );

      const user = { id: result.insertId, fullName, email, role };
      return res.status(201).json({ message: "Account created successfully.", token: createToken(user), user });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().normalizeEmail().withMessage("Enter a valid email address."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationErrors(req);
      if (errors) return res.status(400).json({ message: "Please correct the form.", errors });

      const [rows] = await pool.execute(
        "SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1",
        [req.body.email],
      );
      const account = rows[0];

      if (!account || !account.is_active || !(await bcrypt.compare(req.body.password, account.password_hash))) {
        return res.status(401).json({ message: "Incorrect email or password." });
      }

      const user = {
        id: account.id,
        fullName: account.full_name,
        email: account.email,
        role: account.role,
      };
      return res.json({ message: "Login successful.", token: createToken(user), user });
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, full_name AS fullName, email, role, created_at AS createdAt FROM users WHERE id = ? AND is_active = TRUE LIMIT 1",
      [req.user.id],
    );
    if (!rows.length) return res.status(404).json({ message: "User account not found." });
    return res.json({ user: rows[0] });
  } catch (error) {
    return next(error);
  }
});

export default router;
