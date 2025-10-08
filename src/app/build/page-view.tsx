"use client";
import { useEffect } from 'react';
import { logEvent } from '../../lib/analytics-client';

export default function BuildPageView({ id }:{ id: string }){
  useEffect(()=>{ try { logEvent('page_view', { page: 'build_detail', id }); } catch {} }, [id]);
  return null;
}

