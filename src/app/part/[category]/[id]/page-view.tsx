"use client";
import { useEffect } from 'react';
import { logEvent } from '../../../../lib/analytics-client';

export default function PartPageView({ category, id }:{ category: string; id: string }){
  useEffect(()=>{ try { logEvent('page_view', { page: 'part_detail', category, id }); } catch {} }, [category, id]);
  return null;
}

