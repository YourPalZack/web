"use client";
import { useEffect } from 'react';
import { logEvent } from '../../../../lib/analytics-client';

export default function SpeciesPageView({ category, id }:{ category: string; id: string }){
  useEffect(()=>{ try { logEvent('page_view', { page: 'species_detail', category, id }); } catch {} }, [category, id]);
  return null;
}

