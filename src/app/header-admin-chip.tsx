"use client";
import { useEffect, useState } from 'react';

export default function HeaderAdminChip(){
  const [admin, setAdmin] = useState<boolean>(false);
  useEffect(()=>{
    let t:any;
    const run = async ()=>{ try{ const r = await fetch('/api/auth/status',{cache:'no-store'}); const j = await r.json(); setAdmin(!!j?.admin); }catch{} };
    run(); t = setInterval(run, 15000); return ()=> clearInterval(t);
  },[]);
  if (!admin) return null;
  return <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 border border-green-300">Admin</span>;
}

