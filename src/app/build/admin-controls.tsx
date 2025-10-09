"use client";
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@aquabuilder/ui';
import { showToast } from '@aquabuilder/ui';
import { logEvent } from '../../lib/analytics-client';

export default function BuildAdminControls({ id, initialName, initialPublic }:{ id: string; initialName: string; initialPublic?: boolean }){
  const [admin, setAdmin] = useState(false);
  const [name, setName] = useState(initialName);
  const [isPublic, setIsPublic] = useState(!!initialPublic);
  useEffect(()=>{ (async()=>{ try{ const r = await fetch('/api/auth/status',{cache:'no-store'}); const j = await r.json(); setAdmin(!!j?.admin); }catch{} })(); },[]);
  if (!admin) return null;
  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-green-100">
      <CardHeader><CardTitle>Admin • Build</CardTitle></CardHeader>
      <CardContent className="text-sm space-y-2">
        <div>
          <div className="text-gray-600">Name</div>
          <Input value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isPublic} onChange={(e)=>setIsPublic(e.target.checked)} />
          <span>Public (shows on Community)</span>
        </label>
        <div className="pt-2">
          <Button onClick={async()=>{
            try{
              const res = await fetch(`/api/builds/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, isPublic }) });
              if (res.ok){ showToast('Build updated'); try{ logEvent('build_admin_update', { id, isPublic }); }catch{} }
              else showToast('Failed to update');
            }catch{ showToast('Failed to update'); }
          }}>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
}
