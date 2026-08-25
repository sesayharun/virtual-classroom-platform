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
    let params;
    if (req.user.role === "teacher") {
      sql = `SELECT m.id, m.class_id AS classId, m.title, m.description, m.resource_url AS resourceUrl,
                    m.resource_type AS resourceType, m.created_at AS createdAt,
                    c.code AS classCode, c.title AS classTitle
             FROM materials m JOIN classes c ON c.id = m.class_id
             WHERE c.teacher_id = ? ORDER BY m.created_at DESC`;
      params = [req.user.id];
    } else if (req.user.role === "student") {
      sql = `SELECT m.id, m.class_id AS classId, m.title, m.description, m.resource_url AS resourceUrl,
                    m.resource_type AS resourceType, m.created_at AS createdAt,
                    c.code AS classCode, c.title AS classTitle
             FROM materials m
             JOIN classes c ON c.id = m.class_id
             JOIN enrollments e ON e.class_id = c.id
             WHERE e.student_id = ? ORDER BY m.created_at DESC`;
      params = [req.user.id];
    } else {
      sql = `SELECT m.id, m.class_id AS classId, m.title, m.description, m.resource_url AS resourceUrl,
                    m.resource_type AS resourceType, m.created_at AS createdAt,
                    c.code AS classCode, c.title AS classTitle
             FROM materials m JOIN classes c ON c.id = m.class_id ORDER BY m.created_at DESC`;
      params = [];
    }
    const [rows] = await pool.execute(sql, params);
    return res.json({ materials: rows });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/",
  allowRoles("teacher"),
  [
    body("classId").isInt({ min: 1 }).withMessage("Choose a class."),
    body("title").trim().isLength({ min: 3, max: 180 }).withMessage("Material title must contain 3 to 180 characters."),
    body("description").optional({ checkFalsy: true }).trim().isLength({ max: 1500 }).withMessage("Description cannot exceed 1500 characters."),
    body("resourceUrl").isURL({ protocols: ["http", "https"], require_protocol: true }).withMessage("Enter a complete http or https resource link."),
    body("resourceType").isIn(["document", "video", "presentation", "link"]).withMessage("Choose a valid resource type."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationErrors(req);
      if (errors) return res.status(400).json({ message: "Please correct the material form.", errors });

      const [classes] = await pool.execute("SELECT id FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1", [req.body.classId, req.user.id]);
      if (!classes.length) return res.status(403).json({ message: "You can only add materials to your own classes." });

      const [result] = await pool.execute(
        "INSERT INTO materials (class_id, title, description, resource_url, resource_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
        [req.body.classId, req.body.title, req.body.description || null, req.body.resourceUrl, req.body.resourceType, req.user.id],
      );
      return res.status(201).json({ message: "Material published successfully.", material: { id: result.insertId } });
    } catch (error) {
      return next(error);
    }
  },
);

router.delete("/:id", allowRoles("teacher"), async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      `DELETE m FROM materials m
       JOIN classes c ON c.id = m.class_id
       WHERE m.id = ? AND c.teacher_id = ?`,
      [req.params.id, req.user.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Material not found or not owned by you." });
    return res.json({ message: "Material removed successfully." });
  } catch (error) {
    return next(error);
  }
});

export default router;
