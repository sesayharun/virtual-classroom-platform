"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Classroom = {
  id: number;
  code: string;
  title: string;
  description?: string;
  schedule?: string;
  teacherName?: string;
  studentCount?: number;
};

const API_URL = "http://localhost:4000";

export default function ClassroomView({ role, token }: { role: "student" | "teacher" | "admin"; token: string }) {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selected, setSelected] = useState<Classroom | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("");

  const request = useCallback(async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.errors?.[0]?.message || data.message || "Request failed.");
    return data;
  }, [token]);

  const loadClasses = useCallback(async () => {
    try {
      const data = await request("/api/classes");
      setClasses(data.classes);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load classes.");
    }
  }, [request]);

  useEffect(() => { void loadClasses(); }, [loadClasses]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (role === "student") {
        const data = await request("/api/classes/join", { method: "POST", body: JSON.stringify({ code }) });
        setMessage(data.message);
        setCode("");
      } else {
        const data = await request("/api/classes", { method: "POST", body: JSON.stringify({ code, title, description, schedule }) });
        setMessage(data.message);
        setCode(""); setTitle(""); setDescription(""); setSchedule(""); setShowForm(false);
      }
      await loadClasses();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function openClassroom(id: number) {
    setBusy(true);
    setMessage("");
    try {
      const data = await request(`/api/classes/${id}`);
      setSelected(data.class);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open the classroom.");
    } finally {
      setBusy(false);
    }
  }

  if (selected) {
    return <section className="classroom-detail">
      <button className="back-link" onClick={() => setSelected(null)}>← Back to classes</button>
      <div className="classroom-hero">
        <div><p className="eyebrow">{selected.code}</p><h1>{selected.title}</h1><p>{selected.description || "No class description has been added yet."}</p></div>
        <span>{selected.studentCount || 0}<small>Students</small></span>
      </div>
      <div className="classroom-sections">
        <article><span>◷</span><h3>Class schedule</h3><p>{selected.schedule || "The teacher has not added a schedule."}</p></article>
        <article><span>▤</span><h3>Assignments</h3><p>Assignments for this class will appear here in the next feature milestone.</p></article>
        <article><span>◇</span><h3>Materials</h3><p>Learning resources will be connected to this classroom next.</p></article>
      </div>
    </section>;
  }

  return <>
    <div className="page-title"><div><p className="eyebrow">Learning spaces</p><h1>{role === "student" ? "My classes" : "Classes I manage"}</h1><p>{role === "student" ? "Join a class using the code from your teacher." : "Create and manage your teaching spaces."}</p></div><button className="primary" onClick={() => setShowForm(!showForm)}>{role === "student" ? (showForm ? "Cancel" : "Join class") : (showForm ? "Cancel" : "+ Create class")}</button></div>

    {showForm && <form className="class-action-form" onSubmit={submit}>
      <label>Class code<input value={code} onChange={event => setCode(event.target.value)} placeholder="Example: CS401" required /></label>
      {role !== "student" && <>
        <label>Class title<input value={title} onChange={event => setTitle(event.target.value)} placeholder="Applied Artificial Intelligence" required /></label>
        <label>Schedule<input value={schedule} onChange={event => setSchedule(event.target.value)} placeholder="Monday · 10:00 AM" /></label>
        <label className="full">Description<textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="What will students learn in this class?" /></label>
      </>}
      <button className="primary" disabled={busy}>{busy ? "Please wait…" : role === "student" ? "Join classroom" : "Create classroom"}</button>
    </form>}

    {message && <div className="class-message">{message}</div>}

    {classes.length ? <div className="course-grid">{classes.map((course, index) => <article className="course" key={course.id}><div className={`cover ${["purple","orange","green"][index % 3]}`}><b>{course.code}</b><span>{course.title.split(" ").map(word => word[0]).join("").slice(0,3)}</span></div><div className="course-body"><h2>{course.title}</h2><p>{course.teacherName || (role === "teacher" ? "You are the teacher" : "Teacher")}</p><label><span>{course.schedule || "Schedule not set"}</span><b>{course.studentCount || 0} students</b></label><button onClick={() => openClassroom(course.id)} disabled={busy}>Enter classroom →</button></div></article>)}</div>
      : <section className="empty-classes"><span>▣</span><h2>No classes yet</h2><p>{role === "student" ? "Ask your teacher for a class code, then select Join class." : "Select Create class to create your first learning space."}</p></section>}
  </>;
}
