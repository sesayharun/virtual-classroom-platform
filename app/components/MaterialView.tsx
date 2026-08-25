"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Material={id:number;classId:number;title:string;description?:string;resourceUrl:string;resourceType:"document"|"video"|"presentation"|"link";classCode:string;classTitle:string;createdAt:string};
type ClassOption={id:number;code:string;title:string};
const API_URL="http://localhost:4000";

export default function MaterialView({role,token}:{role:"student"|"teacher"|"admin";token:string}){
  const[materials,setMaterials]=useState<Material[]>([]);
  const[classes,setClasses]=useState<ClassOption[]>([]);
  const[showForm,setShowForm]=useState(false);
  const[message,setMessage]=useState("");
  const[busy,setBusy]=useState(false);
  const[classId,setClassId]=useState("");
  const[title,setTitle]=useState("");
  const[description,setDescription]=useState("");
  const[resourceUrl,setResourceUrl]=useState("");
  const[resourceType,setResourceType]=useState<Material["resourceType"]>("document");
  const[search,setSearch]=useState("");

  const request=useCallback(async(path:string,options:RequestInit={})=>{
    const response=await fetch(`${API_URL}${path}`,{...options,headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,...options.headers}});
    const data=await response.json();
    if(!response.ok)throw new Error(data.errors?.[0]?.message||data.message||"Request failed.");
    return data;
  },[token]);

  const load=useCallback(async()=>{
    try{
      const data=await request("/api/materials");setMaterials(data.materials);
      if(role==="teacher"){const classData=await request("/api/classes");setClasses(classData.classes)}
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to load materials.")}
  },[request,role]);

  useEffect(()=>{void load()},[load]);

  async function publish(event:FormEvent){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const data=await request("/api/materials",{method:"POST",body:JSON.stringify({classId:Number(classId),title,description,resourceUrl,resourceType})});
      setMessage(data.message);setClassId("");setTitle("");setDescription("");setResourceUrl("");setShowForm(false);await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to publish material.")}
    finally{setBusy(false)}
  }

  async function remove(id:number){
    if(!window.confirm("Remove this material from the class?"))return;
    setBusy(true);setMessage("");
    try{const data=await request(`/api/materials/${id}`,{method:"DELETE"});setMessage(data.message);await load()}
    catch(error){setMessage(error instanceof Error?error.message:"Unable to remove material.")}
    finally{setBusy(false)}
  }

  const filtered=materials.filter(item=>`${item.title} ${item.classCode} ${item.classTitle} ${item.resourceType}`.toLowerCase().includes(search.toLowerCase()));
  const icon={document:"▤",video:"▶",presentation:"▣",link:"↗"};

  return <><div className="page-title"><div><p className="eyebrow">Resource library</p><h1>Learning materials</h1><p>{role==="teacher"?"Publish trusted resources for your classes.":"Open resources shared by your teachers."}</p></div>{role==="teacher"&&<button className="primary" onClick={()=>setShowForm(!showForm)}>{showForm?"Cancel":"+ Add material"}</button>}</div>

  {role==="teacher"&&showForm&&<form className="material-form" onSubmit={publish}><label>Class<select value={classId} onChange={e=>setClassId(e.target.value)} required><option value="">Choose a class</option>{classes.map(item=><option key={item.id} value={item.id}>{item.code} — {item.title}</option>)}</select></label><label>Resource type<select value={resourceType} onChange={e=>setResourceType(e.target.value as Material["resourceType"])}><option value="document">Document</option><option value="video">Video</option><option value="presentation">Presentation</option><option value="link">Web link</option></select></label><label>Title<input value={title} onChange={e=>setTitle(e.target.value)} required/></label><label className="full">Resource URL<input type="url" value={resourceUrl} onChange={e=>setResourceUrl(e.target.value)} placeholder="https://..." required/></label><label className="full">Description<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><button className="primary" disabled={busy}>{busy?"Publishing…":"Publish material"}</button></form>}

  {message&&<div className="class-message">{message}</div>}
  <div className="search">⌕ <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search materials, classes or resource types…"/></div>
  {filtered.length?<div className="material-grid">{filtered.map(item=><article key={item.id}><i className={`material-${item.resourceType}`}>{icon[item.resourceType]}</i><div><em>{item.classCode} · {item.resourceType}</em><h3>{item.title}</h3><p>{item.description||item.classTitle}</p><small>Published {new Date(item.createdAt).toLocaleDateString()}</small></div><div className="material-actions"><a href={item.resourceUrl} target="_blank" rel="noreferrer">Open →</a>{role==="teacher"&&<button disabled={busy} onClick={()=>remove(item.id)}>Remove</button>}</div></article>)}</div>:<section className="empty-classes"><span>◇</span><h2>No materials found</h2><p>{role==="teacher"?"Add the first resource for one of your classes.":"Your teachers have not published any materials yet."}</p></section>}</>;
}
