# Exam Registration System

A full-stack Software Engineering Lab mini project built with HTML, CSS, JavaScript, Node.js, Express and MySQL. It does **not** include a payment gateway.

## Features

- Student account registration and login
- Admin login and dashboard
- Exam creation and registration open/close control (API supported)
- Student eligibility check based on course and semester
- Duplicate application prevention
- Registration status: Pending, Approved, Rejected
- Admin approval and rejection
- Hall ticket generation for approved applications (print or save as PDF from browser)
- Registration reports and student list

## Requirements

- Node.js 18 or later
- MySQL 8 or compatible
- VS Code (recommended)

## 1. Set up the database

1. Start MySQL.
2. Open MySQL Workbench or a MySQL terminal.
3. Run the complete script in `database/schema.sql`.

This creates the `exam_registration` database and its tables.

## 2. Configure environment variables

In the project root, copy `.env.example` to a new file named `.env`.

Update the MySQL password and set a long random JWT secret:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=use_a_long_random_secret_here
JWT_EXPIRES_IN=1d
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=exam_registration
```

Do not upload `.env` to GitHub.

## 3. Install dependencies

Open the project folder in VS Code. Open Terminal > New Terminal and run:

```bash
npm install
```

## 4. Create the first admin account

```bash
npm run seed:admin
```

Default local demo credentials:

- Email: `admin@examportal.local`
- Password: `Admin@12345`

Change this password before using the system beyond a local classroom demonstration. The seed script does not overwrite an existing admin.

## 5. Start the application

```bash
npm run dev
```

Open:

`http://localhost:5000`

The backend serves the frontend from the same local server, so you do not need a separate frontend server.

## 6. Suggested demo sequence

1. Log in as admin using the seeded account.
2. Create an exam, e.g. code `EX-JAVA-01`, title `Java Programming`, course `AIML`, semester `5`, date, time and venue.
3. Log out.
4. Create a student account using the same course and semester.
5. Log in as the student and apply for the exam.
6. Log out and log back in as admin.
7. Approve the student's pending application.
8. Log in as the student again and open the hall ticket.
9. Use **Print / Save as PDF** to save a copy.
10. Check the admin report.

## Project structure

```text
exam-registration-system/
├── database/schema.sql
├── public/
│   ├── css/styles.css
│   ├── js/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── admin.html
│   └── hall-ticket.html
├── scripts/seedAdmin.js
├── src/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── routes/
│   └── utils/ids.js
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

## API overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create student account |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Logged-in | Current user |
| GET | `/api/exams` | Logged-in | List exams |
| POST | `/api/exams` | Admin | Create exam |
| PATCH | `/api/exams/:id/registration` | Admin | Open/close exam registration |
| POST | `/api/registrations` | Student | Apply for exam |
| GET | `/api/registrations/mine` | Student | View own applications |
| GET | `/api/registrations/hall-ticket/:registrationId` | Student | Get approved hall ticket |
| GET | `/api/admin/registrations` | Admin | View all applications |
| PATCH | `/api/admin/registrations/:id/status` | Admin | Approve/reject |
| GET | `/api/admin/reports` | Admin | Registration report |
| GET | `/api/admin/students` | Admin | Student list |

## Notes

- Registration is free in this mini-project; there is no payment processing.
- Student eligibility is checked using exact course and semester matching.
- A student can apply only once for each exam.
- Hall tickets are available only after approval.
- This is an educational project starter. Before production use, add HTTPS deployment, stronger operational controls, audit logging, password reset, email verification and more extensive automated tests.
