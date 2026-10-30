require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./src/routes/authRoutes");
const examRoutes = require("./src/routes/examRoutes");
const registrationRoutes = require("./src/routes/registrationRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "Exam Registration System API" }));
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Exam Registration System running at http://localhost:${port}`));
