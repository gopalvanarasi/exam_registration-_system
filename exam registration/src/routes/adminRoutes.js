const router = require("express").Router();
const db = require("../config/db");
const { authenticate, allowRoles } = require("../middleware/auth");

router.use(authenticate, allowRoles("admin"));

router.get("/registrations", async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.id, r.registration_no, r.status, r.applied_at,
              u.name AS student_name, s.roll_no, s.course, s.semester,
              e.exam_code, e.title AS exam_title, e.exam_date
       FROM registrations r
       JOIN students s ON s.id = r.student_id
       JOIN users u ON u.id = s.user_id
       JOIN exams e ON e.id = r.exam_id
       ORDER BY r.applied_at DESC`
    );
    res.json({ registrations: rows });
  } catch (err) { next(err); }
});

router.patch("/registrations/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be Approved or Rejected." });
    }
    const [result] = await db.execute(
      `UPDATE registrations SET status = ?, reviewed_at = NOW(), reviewed_by = ?
       WHERE id = ? AND status = 'Pending'`,
      [status, req.user.id, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Pending registration not found." });
    res.json({ message: `Registration ${status.toLowerCase()}.` });
  } catch (err) { next(err); }
});

router.get("/reports", async (req, res, next) => {
  try {
    const [summary] = await db.execute(
      `SELECT COUNT(*) AS total,
       SUM(status = 'Pending') AS pending,
       SUM(status = 'Approved') AS approved,
       SUM(status = 'Rejected') AS rejected
       FROM registrations`
    );
    const [byExam] = await db.execute(
      `SELECT e.exam_code, e.title, COUNT(r.id) AS total_registrations,
       SUM(r.status = 'Approved') AS approved,
       SUM(r.status = 'Pending') AS pending,
       SUM(r.status = 'Rejected') AS rejected
       FROM exams e LEFT JOIN registrations r ON r.exam_id = e.id
       GROUP BY e.id ORDER BY e.exam_date`
    );
    res.json({ summary: summary[0], byExam });
  } catch (err) { next(err); }
});

router.get("/students", async (req, res, next) => {
  try {
    const [students] = await db.execute(
      `SELECT u.name, u.email, s.roll_no, s.course, s.semester, s.phone
       FROM students s JOIN users u ON u.id = s.user_id ORDER BY s.roll_no`
    );
    res.json({ students });
  } catch (err) { next(err); }
});

module.exports = router;
