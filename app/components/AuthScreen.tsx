"use client";

import { FormEvent, useState } from "react";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: "student" | "teacher" | "admin";
};

type AuthResponse = {
  message: string;
  token?: string;
  user?: AuthUser;
  errors?: { field: string; message: string }[];
};

const API_URL = "http://localhost:4000";

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const endpoint = mode === "login" ? "login" : "register";
      const body = mode === "login" ? { email, password } : { fullName, email, password, role };
      const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as AuthResponse;

      if (!response.ok || !data.user || !data.token) {
        setMessage(data.errors?.[0]?.message || data.message || "Authentication failed.");
        return;
      }

      onAuthenticated(data.user, data.token);
    } catch {
      setMessage("Unable to reach the server. Confirm that the backend is running on port 4000.");
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="brand auth-brand"><span>U</span><div><b>UniClass</b><small>Virtual learning</small></div></div>
        <p className="eyebrow">University learning, connected</p>
        <h1>One classroom for every course and conversation.</h1>
        <p>Attend classes, manage assignments, find learning materials and collaborate from one secure platform.</p>
        <div className="auth-points">
          <span>✓ Secure student and teacher accounts</span>
          <span>✓ Role-based learning dashboard</span>
          <span>✓ Your coursework in one place</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">{mode === "login" ? "Welcome back" : "Join UniClass"}</p>
          <h2>{mode === "login" ? "Sign in to your classroom" : "Create your account"}</h2>
          <p>{mode === "login" ? "Enter your details to continue." : "Register as a student or teacher."}</p>

          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Sign in</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Register</button>
          </div>

          <form onSubmit={submit}>
            {mode === "register" && (
              <>
                <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} required /></label>
                <label>Account type<select value={role} onChange={(event) => setRole(event.target.value as "student" | "teacher")}><option value="student">Student</option><option value="teacher">Teacher</option></select></label>
              </>
            )}
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
            {message && <div className="auth-error">{message}</div>}
            <button className="primary auth-submit" disabled={submitting}>{submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
          <small className="auth-note">Passwords are securely hashed before storage.</small>
        </div>
      </section>
    </main>
  );
}
