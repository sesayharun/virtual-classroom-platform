"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Assignment = { id:number; classId:number; title:string; instructions:string; dueAt:string; classCode:string; classTitle:string; submissionCount?:number; submissionId?:number; status?:string; grade?:number|null; feedback?:string };
type ClassOption = { id:number; code:string; title:string };
type Submission = { id:number; studentName:string; email:string; content:string; fileUrl?:string; status:string; grade?:number|null; feedback?:string };

const API_URL="http://localhost:4000";

export default function AssignmentView({role,token}:{role:"student"|"teacher"|"admin";token:string}){
  const[assignments,setAssignments]=useState<Assignment[]>([]);
  const[classes,setClasses]=useState<ClassOption[]>([]);
  const[selected,setSelected]=useState<Assignment|null>(null);
  const[submissions,setSubmissions]=useState<Submission[]>([]);
  const[showForm,setShowForm]=useState(false);
  const[message,setMessage]=useState("");
  const[busy,setBusy]=useState(false);
  const[classId,setClassId]=useState("");
  const[title,setTitle]=useState("");
  const[instructions,setInstructions]=useState("");
  const[dueAt,setDueAt]=useState("");
  const[answer,setAnswer]=useState("");
  const[fileUrl,setFileUrl]=useState("");

  const request=useCallback(async(path:string,options:RequestInit={})=>{
    const response=await fetch(`${API_URL}${path}`,{...options,headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,...options.headers}});
    const data=await response.json();
    if(!response.ok)throw new Error(data.errors?.[0]?.message||data.message||"Request failed.");
    return data;
  },[token]);

  const load=useCallback(async()=>{
    try{
      const data=await request("/api/assignments");
      setAssignments(data.assignments);
      if(role==="teacher"){
        const classData=await request("/api/classes");
        setClasses(classData.classes);
      }
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to load assignments.")}
  },[request,role]);

  useEffect(()=>{void load()},[load]);

  async function createAssignment(event:FormEvent){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const data=await request("/api/assignments",{method:"POST",body:JSON.stringify({classId:Number(classId),title,instructions,dueAt:new Date(dueAt).toISOString()})});
      setMessage(data.message);setClassId("");setTitle("");setInstructions("");setDueAt("");setShowForm(false);await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to create assignment.")}
    finally{setBusy(false)}
  }

  async function submitWork(event:FormEvent){
    event.preventDefault();if(!selected)return;setBusy(true);setMessage("");
    try{
      const data=await request(`/api/assignments/${selected.id}/submit`,{method:"POST",body:JSON.stringify({content:answer,fileUrl})});
      setMessage(data.message);setSelected(null);setAnswer("");setFileUrl("");await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to submit assignment.")}
    finally{setBusy(false)}
  }

  async function viewSubmissions(assignment:Assignment){
    setBusy(true);setMessage("");
    try{const data=await request(`/api/assignments/${assignment.id}/submissions`);setSelected(assignment);setSubmissions(data.submissions)}
    catch(error){setMessage(error instanceof Error?error.message:"Unable to load submissions.")}
    finally{setBusy(false)}
  }

  async function grade(submissionId:number,gradeValue:string,feedback:string){
    setBusy(true);setMessage("");
    try{
      const data=await request(`/api/assignments/submissions/${submissionId}/grade`,{method:"PATCH",body:JSON.stringify({grade:Number(gradeValue),feedback})});
      setMessage(data.message);
      if(selected)await viewSubmissions(selected);
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to save grade.")}
    finally{setBusy(false)}
  }

  if(selected&&role==="teacher")return <><button className="back-link" onClick={()=>setSelected(null)}>← Back to assignments</button><div className="page-title"><div><p className="eyebrow">{selected.classCode}</p><h1>{selected.title}</h1><p>Review and grade student submissions.</p></div></div>{message&&<div className="class-message">{message}</div>}<div className="submission-list">{submissions.length?submissions.map(item=><SubmissionCard key={item.id} item={item} busy={busy} onGrade={grade}/>):<section className="empty-classes"><span>✓</span><h2>No submissions yet</h2><p>Student work will appear here after submission.</p></section>}</div></>;

  return <><div className="page-title"><div><p className="eyebrow">Coursework</p><h1>Assignments</h1><p>{role==="teacher"?"Create assignments and review student work.":"View deadlines and submit your coursework."}</p></div>{role==="teacher"&&<button className="primary" onClick={()=>setShowForm(!showForm)}>{showForm?"Cancel":"+ New assignment"}</button>}</div>

  {role==="teacher"&&showForm&&<form className="assignment-form" onSubmit={createAssignment}><label>Class<select value={classId} onChange={e=>setClassId(e.target.value)} required><option value="">Choose a class</option>{classes.map(item=><option key={item.id} value={item.id}>{item.code} — {item.title}</option>)}</select></label><label>Assignment title<input value={title} onChange={e=>setTitle(e.target.value)} required/></label><label>Deadline<input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} required/></label><label className="full">Instructions<textarea value={instructions} onChange={e=>setInstructions(e.target.value)} required/></label><button className="primary" disabled={busy}>{busy?"Saving…":"Create assignment"}</button></form>}

  {message&&<div className="class-message">{message}</div>}

  {selected&&role==="student"&&<form className="submission-form" onSubmit={submitWork}><button type="button" className="back-link" onClick={()=>setSelected(null)}>← Cancel</button><h2>{selected.title}</h2><p>{selected.instructions}</p>{selected.status==="graded"&&<div className="grade-feedback"><strong>Grade: {selected.grade}/100</strong><p>{selected.feedback||"No written feedback was added."}</p></div>}<label>Your answer or submission note<textarea value={answer} onChange={e=>setAnswer(e.target.value)} required/></label><label>Project or file link (optional)<input type="url" value={fileUrl} onChange={e=>setFileUrl(e.target.value)} placeholder="https://..."/></label><button className="primary" disabled={busy}>{busy?"Submitting…":selected.submissionId?"Update submission":"Submit assignment"}</button></form>}

  {!selected&&(assignments.length?<section className="card assignment-list">{assignments.map(item=><article key={item.id}><div className="assignment-icon">DOC</div><div><em>{item.classCode}</em><h3>{item.title}</h3><p>{item.instructions}</p><small>Due {new Date(item.dueAt).toLocaleString()}</small></div><span className={item.status||""}>{role==="teacher"?`${item.submissionCount||0} submissions`:item.status==="graded"?`Graded: ${item.grade}/100`:item.status||"Not submitted"}</span><button onClick={()=>role==="teacher"?viewSubmissions(item):setSelected(item)}>{role==="teacher"?"Review":"Open"}</button></article>)}</section>:<section className="empty-classes"><span>✓</span><h2>No assignments yet</h2><p>{role==="teacher"?"Create the first assignment for one of your classes.":"Your teachers have not posted any assignments."}</p></section>)}</>;
}

function SubmissionCard({item,busy,onGrade}:{item:Submission;busy:boolean;onGrade:(id:number,grade:string,feedback:string)=>void}){
  const[gradeValue,setGradeValue]=useState(item.grade?.toString()||"");
  const[feedback,setFeedback]=useState(item.feedback||"");
  return <article><header><div><h3>{item.studentName}</h3><small>{item.email}</small></div><span>{item.status}</span></header><p>{item.content}</p>{item.fileUrl&&<a href={item.fileUrl} target="_blank" rel="noreferrer">Open submitted link →</a>}<div className="grade-row"><label>Grade / 100<input type="number" min="0" max="100" value={gradeValue} onChange={e=>setGradeValue(e.target.value)}/></label><label>Feedback<input value={feedback} onChange={e=>setFeedback(e.target.value)}/></label><button className="primary" disabled={busy||gradeValue===""} onClick={()=>onGrade(item.id,gradeValue,feedback)}>Save grade</button></div></article>
}
