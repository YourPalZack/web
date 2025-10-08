"use client";
import { logEvent } from '../../lib/analytics-client';

export default function CommunityTrackLink({ href, children, buildId }:{ href: string; children: React.ReactNode; buildId: string }){
  return (
    <a href={href} onClick={() => {
      try { logEvent('community_build_click', { href, buildId }); } catch {}
    }} className="border rounded-2xl p-3 hover:shadow">
      {children}
    </a>
  );
}

