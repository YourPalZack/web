"use client";
import { useEffect } from 'react';
import { logEvent } from '../../lib/analytics-client';

export default function CommunityPageView({ type, page }:{ type?: string; page: number }){
  useEffect(()=>{
    try { logEvent('page_view', { page: 'community', type: type ?? null, pageNumber: page }); } catch {}
  }, [type, page]);
  return null;
}

