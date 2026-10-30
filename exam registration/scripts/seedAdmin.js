require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../src/config/db");

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@examportal.local";
    const password = process.env.ADMIN_PASSWORD || "Admin@12345";
    const name = process.env.ADMIN_NAME || "System Administrator";
    const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      console.log(`Admin already exists: ${email}`);
    } else {
      const hash = await bcrypt.hash(password, 12);
      await db.execute("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')", [name, email, hash]);
      console.log(`Admin created. Email: ${email} | Password: ${password}`);
      console.log("Change this password before using the system beyond local testing.");
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();
