import { Router } from "express";
import { body, validationResult } from "express-validator";
import { pool } from "../config/db.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

function errors(req) {
  const result = validationResult(req);
  return result.isEmpty() ? null : result.array().map(({ path, msg }) => ({ field: path, message: msg }));
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    let sql;
    let params;

    if (req.user.role === "teacher") {
      sql = `SELECT c.id, c.code, c.title, c.description, c.schedule,
                    c.teacher_id AS teacherId, u.full_name AS teacherName,
                    COUNT(e.id) AS studentCount, c.created_at AS createdAt
             FROM classes c
             JOIN users u ON u.id = c.teacher_id
             LEFT JOIN enrollments e ON e.class_id = c.id
             WHERE c.teacher_id = ?
             GROUP BY c.id
             ORDER BY c.created_at DESC`;
      params = [req.user.id];
    } else if (req.user.role === "student") {
      sql = `SELECT c.id, c.code, c.title, c.description, c.schedule,
                    c.teacher_id AS teacherId, u.full_name AS teacherName,
                    COUNT(all_enrollments.id) AS studentCount, c.created_at AS createdAt
             FROM enrollments mine
             JOIN classes c ON c.id = mine.class_id
             JOIN users u ON u.id = c.teacher_id
             LEFT JOIN enrollments all_enrollments ON all_enrollments.class_id = c.id
             WHERE mine.student_id = ?
             GROUP BY c.id
             ORDER BY mine.enrolled_at DESC`;
      params = [req.user.id];
    } else {
      sql = `SELECT c.id, c.code, c.title, c.description, c.schedule,
                    c.teacher_id AS teacherId, u.full_name AS teacherName,
                    COUNT(e.id) AS studentCount, c.created_at AS createdAt
             FROM classes c
             JOIN users u ON u.id = c.teacher_id
             LEFT JOIN enrollments e ON e.class_id = c.id
             GROUP BY c.id
             ORDER BY c.created_at DESC`;
      params = [];
    }

    const [rows] = await pool.execute(sql, params);
    return res.json({ classes: rows });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/",
  allowRoles("teacher", "admin"),
  [
    body("code").trim().isLength({ min: 3, max: 30 }).matches(/^[A-Za-z0-9_-]+$/).withMessage("Use 3 to 30 letters, numbers, hyphens or underscores for the class code."),
    body("title").trim().isLength({ min: 3, max: 160 }).withMessage("Class title must contain 3 to 160 characters."),
    body("description").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters."),
    body("schedule").optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage("Schedule cannot exceed 120 characters."),
  ],
  async (req, res, next) => {
    try {
      const validation = errors(req);
      if (validation) return res.status(400).json({ message: "Please correct the class form.", errors: validation });

      const code = req.body.code.toUpperCase();
      const teacherId = req.user.role === "admin" && req.body.teacherId ? Number(req.body.teacherId) : req.user.id;
      const [duplicate] = await pool.execute("SELECT id FROM classes WHERE code = ? LIMIT 1", [code]);
      if (duplicate.length) return res.status(409).json({ message: "That class code is already in use." });

      const [result] = await pool.execute(
        "INSERT INTO classes (code, title, description, schedule, teacher_id) VALUES (?, ?, ?, ?, ?)",
        [code, req.body.title, req.body.description || null, req.body.schedule || null, teacherId],
      );
      return res.status(201).json({ message: "Class created successfully.", class: { id: result.insertId, code, title: req.body.title, description: req.body.description || "", schedule: req.body.schedule || "", teacherId, studentCount: 0 } });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/join",
  allowRoles("student"),
  [body("code").trim().notEmpty().withMessage("Enter a class code.")],
  async (req, res, next) => {
    try {
      const validation = errors(req);
      if (validation) return res.status(400).json({ message: "Enter a valid class code.", errors: validation });

      const code = req.body.code.toUpperCase();
      const [classes] = await pool.execute("SELECT id, code, title FROM classes WHERE code = ? LIMIT 1", [code]);
      if (!classes.length) return res.status(404).json({ message: "No class was found with that code." });

      const classroom = classes[0];
      const [existing] = await pool.execute("SELECT id FROM enrollments WHERE class_id = ? AND student_id = ? LIMIT 1", [classroom.id, req.user.id]);
      if (existing.length) return res.status(409).json({ message: "You have already joined this class." });

      await pool.execute("INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)", [classroom.id, req.user.id]);
      return res.status(201).json({ message: `You joined ${classroom.title}.`, class: classroom });
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.id, c.code, c.title, c.description, c.schedule,
              c.teacher_id AS teacherId, u.full_name AS teacherName,
              COUNT(e.id) AS studentCount, c.created_at AS createdAt
       FROM classes c
       JOIN users u ON u.id = c.teacher_id
       LEFT JOIN enrollments e ON e.class_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ message: "Class not found." });
    const classroom = rows[0];

    if (req.user.role === "teacher" && classroom.teacherId !== req.user.id) {
      return res.status(403).json({ message: "You do not manage this class." });
    }
    if (req.user.role === "student") {
      const [membership] = await pool.execute("SELECT id FROM enrollments WHERE class_id = ? AND student_id = ? LIMIT 1", [classroom.id, req.user.id]);
      if (!membership.length) return res.status(403).json({ message: "Join this class before opening it." });
    }
    return res.json({ class: classroom });
  } catch (error) {
    return next(error);
  }
});

export default router;
