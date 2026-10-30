const router = require("express").Router();
const db = require("../config/db");
const { authenticate, allowRoles } = require("../middleware/auth");
const { makeId } = require("../utils/ids");

router.post("/", authenticate, allowRoles("student"), async (req, res, next) => {
  try {
    const { examId } = req.body;
    if (!examId) return res.status(400).json({ message: "Select an examination." });
    const [students] = await db.execute("SELECT id, course, semester FROM students WHERE user_id = ?", [req.user.id]);
    if (!students.length) return res.status(404).json({ message: "Student profile not found." });
    const student = students[0];
    const [exams] = await db.execute("SELECT * FROM exams WHERE id = ?", [examId]);
    if (!exams.length) return res.status(404).json({ message: "Examination not found." });
    const exam = exams[0];
    if (!exam.registration_open) return res.status(400).json({ message: "Registration for this exam is closed." });
    if (student.course.toLowerCase() !== exam.course.toLowerCase() || Number(student.semester) !== Number(exam.semester)) {
      return res.status(403).json({ message: "You are not eligible for this examination based on course and semester." });
    }
    const registrationNo = makeId("REG");
    await db.execute(
      "INSERT INTO registrations (registration_no, student_id, exam_id, status) VALUES (?, ?, ?, 'Pending')",
      [registrationNo, student.id, exam.id]
    );
    res.status(201).json({ message: "Application submitted. It is waiting for admin approval.", registrationNo });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "You have already applied for this examination." });
    next(err);
  }
});

router.get("/mine", authenticate, allowRoles("student"), async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.id, r.registration_no, r.status, r.applied_at, e.exam_code, e.title, e.exam_date, e.exam_time, e.venue,
              h.ticket_no
       FROM registrations r
       JOIN students s ON s.id = r.student_id
       JOIN exams e ON e.id = r.exam_id
       LEFT JOIN hall_tickets h ON h.registration_id = r.id
       WHERE s.user_id = ? ORDER BY r.applied_at DESC`,
      [req.user.id]
    );
    res.json({ registrations: rows });
  } catch (err) { next(err); }
});

router.get("/hall-ticket/:registrationId", authenticate, allowRoles("student"), async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.id, r.registration_no, r.status, u.name, s.roll_no, s.course, s.semester,
              e.exam_code, e.title, e.exam_date, e.exam_time, e.venue, h.ticket_no
       FROM registrations r
       JOIN students s ON s.id = r.student_id
       JOIN users u ON u.id = s.user_id
       JOIN exams e ON e.id = r.exam_id
       LEFT JOIN hall_tickets h ON h.registration_id = r.id
       WHERE r.id = ? AND s.user_id = ?`,
      [req.params.registrationId, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Registration not found." });
    if (rows[0].status !== "Approved") return res.status(403).json({ message: "Hall ticket is available only after approval." });
    if (!rows[0].ticket_no) {
      const ticketNo = makeId("HT");
      await db.execute("INSERT INTO hall_tickets (registration_id, ticket_no) VALUES (?, ?)", [rows[0].id, ticketNo]);
      rows[0].ticket_no = ticketNo;
    }
    res.json({ hallTicket: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
