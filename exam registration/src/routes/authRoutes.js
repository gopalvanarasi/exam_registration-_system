const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");

router.post("/register", async (req, res, next) => {
  const { name, email, password, rollNo, course, semester, phone } = req.body;
  if (!name || !email || !password || !rollNo || !course || !semester) {
    return res.status(400).json({ message: "Please fill all required student details." });
  }
  if (String(password).length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters." });
  if (!Number.isInteger(Number(semester)) || Number(semester) < 1 || Number(semester) > 12) {
    return res.status(400).json({ message: "Enter a valid semester." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute(
      "SELECT id FROM users WHERE email = ? UNION SELECT user_id AS id FROM students WHERE roll_no = ?",
      [email.trim().toLowerCase(), rollNo.trim()]
    );
    if (existing.length) {
      await conn.rollback();
      return res.status(409).json({ message: "Email or roll number is already registered." });
    }
    const hash = await bcrypt.hash(password, 12);
    const [userResult] = await conn.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'student')",
      [name.trim(), email.trim().toLowerCase(), hash]
    );
    await conn.execute(
      "INSERT INTO students (user_id, roll_no, course, semester, phone) VALUES (?, ?, ?, ?, ?)",
      [userResult.insertId, rollNo.trim(), course.trim(), Number(semester), phone || null]
    );
    await conn.commit();
    res.status(201).json({ message: "Student account created. You can now log in." });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role,
              s.id AS student_id, s.roll_no, s.course, s.semester
       FROM users u LEFT JOIN students s ON s.user_id = u.id
       WHERE u.email = ?`,
      [email.trim().toLowerCase()]
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role, studentId: user.student_id || null },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
    delete user.password_hash;
    res.json({ message: "Login successful.", token, user });
  } catch (err) { next(err); }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.email, u.role, s.id AS student_id, s.roll_no, s.course, s.semester
       FROM users u LEFT JOIN students s ON s.user_id = u.id WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found." });
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
