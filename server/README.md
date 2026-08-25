# Virtual Classroom API

This Express and MySQL API provides the authentication foundation for the Virtual Classroom Platform.

## Endpoints

- `GET /api/health` — server health check
- `POST /api/auth/register` — create a student or teacher account
- `POST /api/auth/login` — authenticate and receive a JWT
- `GET /api/auth/me` — return the current user (Bearer token required)

## Local setup

1. Install MySQL Community Server.
2. Run `database/schema.sql` in MySQL Workbench.
3. From the `server` folder, run `npm install`.
4. Copy `.env.example` to `.env` and enter your local database password and a long random JWT secret.
5. Run `npm run dev`.

Never commit the real `.env` file.
