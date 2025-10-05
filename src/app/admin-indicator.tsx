"use client";
import { useEffect, useState } from 'react';

export default function AdminIndicator(){
  const [admin, setAdmin] = useState<boolean>(false);
  useEffect(()=>{
    let t = 0 as any;
    const fetchStatus = async ()=>{
      try{ const r = await fetch('/api/auth/status', { cache: 'no-store' }); const j = await r.json(); setAdmin(!!j?.admin); }catch{}
    };
    fetchStatus();
    t = setInterval(fetchStatus, 10000);
    return ()=> clearInterval(t);
  },[]);
  if (!admin) return null;
  return (
    <div style={{ position:'fixed', bottom: 12, right: 12 }}>
      <span className="px-2 py-1 rounded text-xs bg-green-600 text-white shadow">Admin</span>
    </div>
  );
}

