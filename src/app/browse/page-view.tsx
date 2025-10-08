"use client";
import { useEffect } from 'react';
import { logEvent } from '../../lib/analytics-client';

export default function BrowsePageView({ tab }:{ tab: string }){
  useEffect(()=>{
    try { logEvent('page_view', { page: 'browse', tab }); } catch {}
  }, [tab]);
  return null;
}

