# Virtual Classroom Platform

A professional full-stack learning platform for teachers and students. It combines a responsive React interface with an Express API, MySQL persistence, JWT authentication and role-based authorization.

## Features

### Authentication
- Student and teacher registration
- Secure bcrypt password hashing
- JWT login sessions
- Protected API routes and role checks

### Classroom management
- Teachers create classes with unique codes
- Students join classes using a code
- Role-protected classroom access
- Class schedules, descriptions and enrolment counts

### Assignments
- Teachers create class assignments
- Students submit answers and project links
- Teachers review, grade and provide feedback
- Students view grades and feedback

### Materials, attendance and discussions
- Teachers publish class learning resources
- Students access resources from enrolled classes
- Teachers record present/absent attendance
- Students view attendance history and percentage
- Class discussion topics and replies

## Technology

- React 19, TypeScript and Vinext/Vite
- Node.js and Express
- MySQL 8
- `mysql2`, `bcryptjs`, JSON Web Tokens
- HTML and responsive CSS

## Local setup

### Requirements

- Node.js 22 or newer
- MySQL Community Server 8
- Git

### 1. Clone and install the frontend

```bash
git clone https://github.com/sesayharun/virtual-classroom-platform.git
cd virtual-classroom-platform
npm install
```

### 2. Create the database

Run `database/schema.sql` using MySQL Shell or MySQL Workbench.

MySQL Shell example:

```text
\connect root@localhost:3306
\sql
\source C:/path/to/virtual-classroom-platform/database/schema.sql
```

### 3. Configure and install the backend

```cmd
cd server
copy .env.example .env
npm install
```

Edit `server/.env` and provide the local MySQL password and a long random JWT secret. Never commit `.env`.

### 4. Run the backend

From `server`:

```cmd
npm run dev
```

The API runs at `http://localhost:4000`.

### 5. Run the frontend

From the project root in another terminal:

```cmd
npm run dev
```

Open the Local URL shown by Vite, normally `http://localhost:5173`.

If Vite selects another port, update `CLIENT_ORIGIN` in `server/.env` and restart the backend.

## Main API groups

- `/api/auth`
- `/api/classes`
- `/api/assignments`
- `/api/materials`
- `/api/attendance`
- `/api/discussions`

## Security

Real secrets, local databases and dependency folders are excluded through `.gitignore`. Public registration allows student and teacher accounts only; administrator accounts are not available through public registration.

## Development workflow

Feature work is completed on dedicated Git branches and merged into `main` after testing.

## Author

Harun A Sesay — Computer Science student and software developer.
