const router = require("express").Router();
const db = require("../config/db");
const { authenticate, allowRoles } = require("../middleware/auth");

router.get("/", authenticate, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.*, COUNT(r.id) AS registration_count
       FROM exams e LEFT JOIN registrations r ON r.exam_id = e.id
       GROUP BY e.id ORDER BY e.exam_date ASC`
    );
    res.json({ exams: rows });
  } catch (err) { next(err); }
});

router.post("/", authenticate, allowRoles("admin"), async (req, res, next) => {
  try {
    const { examCode, title, course, semester, examDate, examTime, venue } = req.body;
    if (!examCode || !title || !course || !semester || !examDate || !examTime || !venue) {
      return res.status(400).json({ message: "All examination fields are required." });
    }
    const [result] = await db.execute(
      `INSERT INTO exams (exam_code, title, course, semester, exam_date, exam_time, venue, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [examCode.trim(), title.trim(), course.trim(), Number(semester), examDate, examTime, venue.trim(), req.user.id]
    );
    res.status(201).json({ message: "Examination created.", examId: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Exam code already exists." });
    next(err);
  }
});

router.patch("/:id/registration", authenticate, allowRoles("admin"), async (req, res, next) => {
  try {
    const { open } = req.body;
    if (typeof open !== "boolean") return res.status(400).json({ message: "Provide open as true or false." });
    const [result] = await db.execute("UPDATE exams SET registration_open = ? WHERE id = ?", [open ? 1 : 0, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Exam not found." });
    res.json({ message: `Registration ${open ? "opened" : "closed"}.` });
  } catch (err) { next(err); }
});

module.exports = router;
