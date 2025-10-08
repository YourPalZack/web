"use client";
import { useEffect } from 'react';
import { logEvent } from '../lib/analytics-client';

export default function HomePageView(){
  useEffect(()=>{ try { logEvent('page_view', { page: 'home' }); } catch {} }, []);
  return null;
}

