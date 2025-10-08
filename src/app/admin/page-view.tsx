"use client";
import { useEffect } from 'react';
import { logEvent } from '../../lib/analytics-client';

export default function AdminPageView({ page }:{ page: string }){
  useEffect(()=>{ try { logEvent('page_view', { page }); } catch {} }, [page]);
  return null;
}

