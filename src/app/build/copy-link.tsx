"use client";
import { Button } from '@aquabuilder/ui';
import { showToast } from '@aquabuilder/ui';
import { logEvent } from '../../lib/analytics-client';

export default function CopyLink({ href, id }:{ href: string; id: string }){
  return (
    <Button variant="secondary" onClick={async ()=>{
      try{ await navigator.clipboard.writeText(href); showToast('Link copied'); try{ logEvent('build_share_copied', { id }); }catch{} }catch{}
    }}>Copy Link</Button>
  );
}

