# Virtual Classroom Platform

A responsive, role-based virtual learning platform for students, teachers and administrators. This repository is a professional reconstruction of a University of Makeni coursework project whose original source files were no longer available.

## Live Application

[Open the Virtual Classroom Platform](https://virtual-classroom-platform.sesayharun9.chatgpt.site)

## Current MVP

- Student, teacher and administrator role previews
- Role-aware dashboard statistics and actions
- Course cards with schedules and progress
- Assignment tracking and submission states
- Learning-material library
- Attendance summaries and course-level rates
- Class discussion board
- Responsive desktop and mobile navigation

The current version is an interactive frontend prototype. Authentication, persistent records, file uploads, live classes and real-time communication are planned backend milestones.

## Technology

- React 19
- TypeScript
- Vinext/Next-compatible application structure
- Vite
- Tailwind CSS
- Cloudflare-compatible server rendering

## Local Setup

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
```

## Main Source Files

```text
app/
├── page.tsx       # Dashboard views and interactions
├── globals.css    # Responsive visual system
└── layout.tsx     # Site metadata and root layout
```

## Development Roadmap

1. Authentication and user roles
2. Persistent database models
3. Class creation and enrolment
4. Assignment submission and grading
5. Attendance recording
6. Material uploads
7. Quizzes and discussion persistence
8. Real-time notifications and live-class integrations

## Responsible Project History

The earlier repository named `Virtual-classroom` contains unrelated archived Django coursework and is not used as the source for this reconstruction. This repository provides a clean and transparent development history for the new platform.

## Author

**Harun A Sesay**  
BSc Computer Science, University of Makeni  
[GitHub Profile](https://github.com/sesayharun)
