"use client";
import { logEvent } from '../../lib/analytics-client';

export default function AmazonTrackLink({ href, children, meta }:{ href: string; children: React.ReactNode; meta?: Record<string, any> }){
  return (
    <a href={href} target="_blank" rel="nofollow sponsored noopener noreferrer" onClick={() => {
      try { logEvent('amazon_popular_click', { href, ...(meta ?? {}) }); } catch {}
    }}>
      {children}
    </a>
  );
}
