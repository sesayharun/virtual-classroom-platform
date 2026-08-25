import { Router } from "express";
import { body, validationResult } from "express-validator";
import { pool } from "../config/db.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function validationErrors(req) {
  const result = validationResult(req);
  return result.isEmpty() ? null : result.array().map(({ path, msg }) => ({ field: path, message: msg }));
}

router.get("/", async (req, res, next) => {
  try {
    let sql;
    if (req.user.role === "teacher") {
      sql = `SELECT a.id, a.class_id AS classId, a.title, a.instructions, a.due_at AS dueAt,
                    a.created_at AS createdAt, c.code AS classCode, c.title AS classTitle,
                    (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS submissionCount
             FROM assignments a JOIN classes c ON c.id = a.class_id
             WHERE c.teacher_id = ? ORDER BY a.due_at ASC`;
    } else if (req.user.role === "student") {
      sql = `SELECT a.id, a.class_id AS classId, a.title, a.instructions, a.due_at AS dueAt,
                    a.created_at AS createdAt, c.code AS classCode, c.title AS classTitle,
                    s.id AS submissionId, s.status, s.grade, s.feedback, s.submitted_at AS submittedAt
             FROM assignments a
             JOIN classes c ON c.id = a.class_id
             JOIN enrollments e ON e.class_id = c.id AND e.student_id = ?
             LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = ?
             ORDER BY a.due_at ASC`;
    } else {
      sql = `SELECT a.id, a.class_id AS classId, a.title, a.instructions, a.due_at AS dueAt,
                    a.created_at AS createdAt, c.code AS classCode, c.title AS classTitle
             FROM assignments a JOIN classes c ON c.id = a.class_id ORDER BY a.due_at ASC`;
    }
    const params = req.user.role === "student" ? [req.user.id, req.user.id] : req.user.role === "teacher" ? [req.user.id] : [];
    const [rows] = await pool.execute(sql, params);
    return res.json({ assignments: rows });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/",
  allowRoles("teacher"),
  [
    body("classId").isInt({ min: 1 }).withMessage("Choose a class."),
    body("title").trim().isLength({ min: 3, max: 180 }).withMessage("Assignment title must contain 3 to 180 characters."),
    body("instructions").trim().isLength({ min: 5, max: 5000 }).withMessage("Instructions must contain 5 to 5000 characters."),
    body("dueAt").isISO8601().withMessage("Choose a valid deadline."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationErrors(req);
      if (errors) return res.status(400).json({ message: "Please correct the assignment form.", errors });

      const [classes] = await pool.execute("SELECT id FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1", [req.body.classId, req.user.id]);
      if (!classes.length) return res.status(403).json({ message: "You can only create assignments for your own classes." });

      const [result] = await pool.execute(
        "INSERT INTO assignments (class_id, title, instructions, due_at, created_by) VALUES (?, ?, ?, ?, ?)",
        [req.body.classId, req.body.title, req.body.instructions, new Date(req.body.dueAt), req.user.id],
      );
      return res.status(201).json({ message: "Assignment created successfully.", assignment: { id: result.insertId } });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/:id/submit",
  allowRoles("student"),
  [
    body("content").trim().isLength({ min: 2, max: 10000 }).withMessage("Add your answer or submission note."),
    body("fileUrl").optional({ checkFalsy: true }).isURL().withMessage("Enter a valid file or project link."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationErrors(req);
      if (errors) return res.status(400).json({ message: "Please correct your submission.", errors });

      const [access] = await pool.execute(
        `SELECT a.id FROM assignments a
         JOIN enrollments e ON e.class_id = a.class_id
         WHERE a.id = ? AND e.student_id = ? LIMIT 1`,
        [req.params.id, req.user.id],
      );
      if (!access.length) return res.status(403).json({ message: "You cannot submit to this assignment." });

      await pool.execute(
        `INSERT INTO submissions (assignment_id, student_id, content, file_url, status, submitted_at)
         VALUES (?, ?, ?, ?, 'submitted', CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE content = VALUES(content), file_url = VALUES(file_url),
           status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
        [req.params.id, req.user.id, req.body.content, req.body.fileUrl || null],
      );
      return res.status(201).json({ message: "Assignment submitted successfully." });
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/:id/submissions", allowRoles("teacher"), async (req, res, next) => {
  try {
    const [access] = await pool.execute(
      "SELECT a.id FROM assignments a JOIN classes c ON c.id = a.class_id WHERE a.id = ? AND c.teacher_id = ? LIMIT 1",
      [req.params.id, req.user.id],
    );
    if (!access.length) return res.status(403).json({ message: "You cannot view these submissions." });
    const [rows] = await pool.execute(
      `SELECT s.id, s.content, s.file_url AS fileUrl, s.status, s.grade, s.feedback,
              s.submitted_at AS submittedAt, u.full_name AS studentName, u.email
       FROM submissions s JOIN users u ON u.id = s.student_id
       WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC`,
      [req.params.id],
    );
    return res.json({ submissions: rows });
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/submissions/:id/grade",
  allowRoles("teacher"),
  [
    body("grade").isFloat({ min: 0, max: 100 }).withMessage("Grade must be between 0 and 100."),
    body("feedback").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("Feedback cannot exceed 2000 characters."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationErrors(req);
      if (errors) return res.status(400).json({ message: "Please correct the grade form.", errors });
      const [result] = await pool.execute(
        `UPDATE submissions s
         JOIN assignments a ON a.id = s.assignment_id
         JOIN classes c ON c.id = a.class_id
         SET s.grade = ?, s.feedback = ?, s.status = 'graded', s.updated_at = CURRENT_TIMESTAMP
         WHERE s.id = ? AND c.teacher_id = ?`,
        [req.body.grade, req.body.feedback || null, req.params.id, req.user.id],
      );
      if (!result.affectedRows) return res.status(404).json({ message: "Submission not found." });
      return res.json({ message: "Submission graded successfully." });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
