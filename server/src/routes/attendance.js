import { Router } from "express";
import { pool } from "../config/db.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router=Router();
router.use(requireAuth);

router.get("/",async(req,res,next)=>{
 try{
  if(req.user.role==="student"){
   const [rows]=await pool.execute(`SELECT s.id,s.session_date AS sessionDate,s.topic,c.code AS classCode,c.title AS classTitle,
   COALESCE(r.status,'absent') AS status FROM attendance_sessions s JOIN classes c ON c.id=s.class_id
   JOIN enrollments e ON e.class_id=c.id AND e.student_id=? LEFT JOIN attendance_records r ON r.session_id=s.id AND r.student_id=?
   ORDER BY s.session_date DESC`,[req.user.id,req.user.id]);
   const present=rows.filter(x=>x.status==="present").length;
   return res.json({sessions:rows,summary:{present,total:rows.length,rate:rows.length?Math.round(present*100/rows.length):0}});
  }
  const [rows]=await pool.execute(`SELECT s.id,s.class_id AS classId,s.session_date AS sessionDate,s.topic,c.code AS classCode,c.title AS classTitle,
  (SELECT COUNT(*) FROM attendance_records r WHERE r.session_id=s.id AND r.status='present') AS presentCount,
  (SELECT COUNT(*) FROM enrollments e WHERE e.class_id=c.id) AS studentCount
  FROM attendance_sessions s JOIN classes c ON c.id=s.class_id WHERE c.teacher_id=? ORDER BY s.session_date DESC`,[req.user.id]);
  return res.json({sessions:rows});
 }catch(error){next(error)}
});

router.get("/class/:classId/students",allowRoles("teacher"),async(req,res,next)=>{
 try{
  const [owned]=await pool.execute("SELECT id FROM classes WHERE id=? AND teacher_id=?",[req.params.classId,req.user.id]);
  if(!owned.length)return res.status(403).json({message:"You do not manage this class."});
  const [students]=await pool.execute(`SELECT u.id,u.full_name AS fullName,u.email FROM enrollments e JOIN users u ON u.id=e.student_id WHERE e.class_id=? ORDER BY u.full_name`,[req.params.classId]);
  res.json({students});
 }catch(error){next(error)}
});

router.post("/",allowRoles("teacher"),async(req,res,next)=>{
 try{
  const {classId,sessionDate,topic,records}=req.body;
  const [owned]=await pool.execute("SELECT id FROM classes WHERE id=? AND teacher_id=?",[classId,req.user.id]);
  if(!owned.length)return res.status(403).json({message:"You do not manage this class."});
  const connection=await pool.getConnection();
  try{
   await connection.beginTransaction();
   const [result]=await connection.execute("INSERT INTO attendance_sessions (class_id,session_date,topic,created_by) VALUES (?,?,?,?)",[classId,sessionDate,topic||null,req.user.id]);
   for(const record of records||[])await connection.execute("INSERT INTO attendance_records (session_id,student_id,status) VALUES (?,?,?)",[result.insertId,record.studentId,record.status==="present"?"present":"absent"]);
   await connection.commit();
   res.status(201).json({message:"Attendance recorded successfully."});
  }catch(error){await connection.rollback();if(error.code==="ER_DUP_ENTRY")return res.status(409).json({message:"Attendance already exists for this class and date."});throw error}finally{connection.release()}
 }catch(error){next(error)}
});

export default router;
