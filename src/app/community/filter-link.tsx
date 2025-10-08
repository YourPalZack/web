"use client";
import { logEvent } from '../../lib/analytics-client';

export default function CommunityFilterLink({ href, active, label, meta }: { href: string; active?: boolean; label: string; meta?: Record<string, any> }) {
  const base = "px-3 py-1 rounded-full border";
  const cls = active ? `${base} bg-blue-600 text-white border-transparent` : `${base} bg-white`;
  return (
    <a
      href={href}
      className={cls}
      onClick={() => {
        try { logEvent('community_filter_click', { href, label, ...(meta ?? {}) }); } catch {}
      }}
    >
      {label}
    </a>
  );
}

