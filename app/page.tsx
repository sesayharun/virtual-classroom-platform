"use client";

import { useEffect, useState } from "react";
import AuthScreen, { AuthUser } from "./components/AuthScreen";
import ClassroomView from "./components/ClassroomView";
import AssignmentView from "./components/AssignmentView";
import MaterialView from "./components/MaterialView";
import AttendanceView from "./components/AttendanceView";
import DiscussionView from "./components/DiscussionView";

type View = "Overview" | "Classes" | "Assignments" | "Materials" | "Attendance" | "Discussion";
type Role = "Student" | "Teacher" | "Admin";

const courses = [
  { code: "CS 401", title: "Applied Artificial Intelligence", lecturer: "Engr. Amadu Wurie Bah", time: "Today · 10:00 AM", progress: 78, color: "purple" },
  { code: "CS 405", title: "Network Security", lecturer: "Engr. Abdulai Brato", time: "Tomorrow · 9:00 AM", progress: 64, color: "orange" },
  { code: "CS 409", title: "Research Project", lecturer: "Project Supervision", time: "Friday · 2:00 PM", progress: 86, color: "green" },
];
const tasks = [
  { title: "Random Forest Model Report", course: "Applied AI", due: "Due tomorrow", status: "In progress" },
  { title: "Access Control List Lab", course: "Network Security", due: "Due Aug 29", status: "Not started" },
  { title: "Chapter Three Draft", course: "Research Project", due: "Submitted", status: "Submitted" },
];
const menu: {name: View; icon: string}[] = [
  {name:"Overview",icon:"⌂"},{name:"Classes",icon:"▣"},{name:"Assignments",icon:"✓"},
  {name:"Materials",icon:"◇"},{name:"Attendance",icon:"◎"},{name:"Discussion",icon:"◌"},
];

function PageTitle({eyebrow,title,text,action}:{eyebrow:string,title:string,text:string,action:string}){
  return <div className="page-title"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div><button className="primary">{action}</button></div>;
}

function Overview({role,setView,name}:{role:Role,setView:(v:View)=>void,name:string}){
  const stats=role==="Student"?[["3","Active classes","+1 this term"],["87%","Attendance","Above target"],["2","Tasks due","This week"]]:role==="Teacher"?[["4","Classes managed","128 learners"],["91%","Avg. attendance","+4% this month"],["18","To grade","3 overdue"]]:[["12","Active classes","468 learners"],["24","Teaching staff","All active"],["98%","System health","Operational"]];
  return <>
    <div className="page-title welcome"><div><p className="eyebrow">Monday, 24 August</p><h1>Good evening, {name}.</h1><p>Here is what is happening in your classroom today.</p></div><button className="primary" onClick={()=>setView("Classes")}>{role==="Student"?"Join next class":role==="Teacher"?"Create assignment":"Manage users"}</button></div>
    <div className="stats">{stats.map(x=><article key={x[1]}><span>↗</span><strong>{x[0]}</strong><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</div>
    <div className="columns"><section className="card"><header><div><p className="eyebrow">Your learning</p><h2>Upcoming classes</h2></div><button onClick={()=>setView("Classes")}>View all →</button></header>{courses.slice(0,2).map(c=><div className="class-row" key={c.code}><i className={c.color}>{c.code.slice(-3)}</i><div><b>{c.title}</b><small>{c.lecturer}</small><em>{c.time}</em></div><button>Open</button></div>)}</section>
      <section className="card"><header><div><p className="eyebrow">Keep moving</p><h2>Assignments</h2></div><button onClick={()=>setView("Assignments")}>View all →</button></header>{tasks.map(t=><div className="task" key={t.title}><i>{t.status==="Submitted"?"✓":""}</i><div><b>{t.title}</b><small>{t.course} · <em>{t.due}</em></small></div></div>)}</section></div>
    <section className="momentum"><div><p className="eyebrow">Semester progress</p><h2>You are building momentum.</h2><p>Complete two remaining tasks to stay on schedule this week.</p></div><div className="ring"><b>76%</b></div></section>
  </>;
}

function Classes(){return <><PageTitle eyebrow="Learning spaces" title="My classes" text="Open a class to view its schedule, materials and activity." action="+ Create class"/><div className="course-grid">{courses.map(c=><article className="course" key={c.code}><div className={`cover ${c.color}`}><b>{c.code}</b><span>{c.title.split(" ").map(w=>w[0]).join("").slice(0,3)}</span></div><div className="course-body"><h2>{c.title}</h2><p>{c.lecturer}</p><label><span>Course progress</span><b>{c.progress}%</b></label><div className="bar"><i style={{width:`${c.progress}%`}}/></div><button>Enter classroom →</button></div></article>)}</div></>}

function Assignments(){return <><PageTitle eyebrow="Coursework" title="Assignments" text="Track deadlines, submissions and feedback in one place." action="+ New assignment"/><section className="card table"><nav><button className="active">All</button><button>Active</button><button>Submitted</button><button>Graded</button></nav>{tasks.map((t,i)=><div className="assignment" key={t.title}><i>{i===2?"DOC":"PDF"}</i><div><b>{t.title}</b><small>{t.course}</small></div><span className={t.status.replace(" ","").toLowerCase()}>{t.status}</span><label><small>Deadline</small><b>{t.due}</b></label><button>View</button></div>)}</section></>}

function Materials(){const files=[["Lecture 06: Ensemble Learning","PDF · 2.4 MB","Applied AI"],["Network Security Lab Guide","PDF · 1.8 MB","Network Security"],["Research Methodology Template","DOCX · 740 KB","Research Project"],["Random Forest Walkthrough","Video · 18 min","Applied AI"]];return <><PageTitle eyebrow="Resource library" title="Learning materials" text="Find lecture notes, guides, recordings and templates." action="+ Upload material"/><div className="search">⌕ <input placeholder="Search materials, courses or file types…"/></div><div className="file-grid">{files.map((f,i)=><article key={f[0]}><i className={`f${i}`}>{i===3?"▶":"▤"}</i><div><em>{f[2]}</em><b>{f[0]}</b><small>{f[1]}</small></div><button>↓</button></article>)}</div></>}

function Attendance(){const rows=[["Applied Artificial Intelligence","12","11","92%"],["Network Security","10","8","80%"],["Research Project","8","8","100%"]];return <><PageTitle eyebrow="Participation" title="Attendance" text="Your attendance record across all active courses." action="Record attendance"/><section className="attendance"><div><span>Overall attendance</span><b>87%</b><small>Target: 80% minimum</small></div><div className="bars">{[45,70,58,88,74,96].map((n,i)=><i key={i} style={{height:`${n}%`}}/>)}</div></section><section className="card attendance-table"><header><span>Course</span><span>Sessions</span><span>Present</span><span>Rate</span></header>{rows.map(r=><div key={r[0]}><b>{r[0]}</b><span>{r[1]}</span><span>{r[2]}</span><strong>{r[3]}</strong></div>)}</section></>}

function Discussion(){const talks=[["HA","How should we interpret feature importance?","Harun A Sesay · Applied AI","6 replies · 24 min ago"],["MK","Clarification on the ACL practical","Musa Kamara · Network Security","3 replies · 2 hours ago"],["FS","Useful sources for Chapter Three","Fatmata Sesay · Research Project","9 replies · Yesterday"]];return <><PageTitle eyebrow="Class community" title="Discussion board" text="Ask questions, share ideas and learn together." action="+ New discussion"/><div className="columns discussion"><section className="card">{talks.map(t=><article className="talk" key={t[1]}><span className="avatar">{t[0]}</span><div><b>{t[1]}</b><small>{t[2]}</small><em>{t[3]}</em></div></article>)}</section><aside className="card"><p className="eyebrow">Popular topics</p><h2>This week</h2>{["Machine learning","Research methods","Network labs","Project support"].map((x,i)=><div className="topic" key={x}><span>0{i+1}</span><b>{x}</b></div>)}</aside></div></>}

export default function Home(){
  const[view,setView]=useState<View>("Overview");
  const[open,setOpen]=useState(false);
  const[user,setUser]=useState<AuthUser|null>(null);
  const[token,setToken]=useState("");
  const[ready,setReady]=useState(false);

  useEffect(()=>{
    const saved=localStorage.getItem("uniclass_user");
    const savedToken=localStorage.getItem("uniclass_token")||"";
    if(saved&&savedToken){
      try{setUser(JSON.parse(saved) as AuthUser);setToken(savedToken)}catch{localStorage.removeItem("uniclass_user");localStorage.removeItem("uniclass_token")}
    }
    setReady(true);
  },[]);

  function authenticated(nextUser:AuthUser,token:string){
    localStorage.setItem("uniclass_user",JSON.stringify(nextUser));
    localStorage.setItem("uniclass_token",token);
    setToken(token);
    setUser(nextUser);
  }

  function logout(){
    localStorage.removeItem("uniclass_user");
    localStorage.removeItem("uniclass_token");
    setToken("");
    setUser(null);
    setView("Overview");
  }

  if(!ready)return <main className="auth-loading">Loading UniClass…</main>;
  if(!user)return <AuthScreen onAuthenticated={authenticated}/>;

  const role=(user.role.charAt(0).toUpperCase()+user.role.slice(1)) as Role;
  const initials=user.fullName.split(" ").map(name=>name[0]).join("").slice(0,2).toUpperCase();

  return <div className="shell"><aside className={open?"open":""}><div className="brand"><span>U</span><div><b>UniClass</b><small>Virtual learning</small></div></div><nav>{menu.map(m=><button key={m.name} className={view===m.name?"active":""} onClick={()=>{setView(m.name);setOpen(false)}}><span>{m.icon}</span>{m.name}{m.name==="Assignments"&&<i>2</i>}</button>)}</nav><div className="help"><span>?</span><b>Need help?</b><p>Visit the student support centre.</p><button>Get support</button></div><footer><span className="avatar">{initials}</span><div><b>{user.fullName}</b><small>{role}</small></div><button onClick={logout} title="Sign out">↪</button></footer></aside><main><header className="top"><button className="hamburger" onClick={()=>setOpen(!open)}>☰</button><div>UniClass <span>/</span> <b>{view}</b></div><span className="role-badge">{role}</span><button className="logout-button" onClick={logout}>Sign out</button><button className="notice">♢<i/></button><span className="avatar">{initials}</span></header><div className="content">{view==="Overview"?<Overview role={role} setView={setView} name={user.fullName}/>:view==="Classes"?<ClassroomView role={user.role} token={token}/>:view==="Assignments"?<AssignmentView role={user.role} token={token}/>:view==="Materials"?<MaterialView role={user.role} token={token}/>:view==="Attendance"?<AttendanceView role={user.role} token={token}/>:<DiscussionView token={token}/>}</div></main></div>
}
