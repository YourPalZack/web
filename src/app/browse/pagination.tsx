"use client";
import { Button } from '@aquabuilder/ui';

export default function Pagination({ page, total, pageSize, onPage }:{ page:number; total:number; pageSize:number; onPage:(p:number)=>void }){
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="col-span-full flex justify-end items-center gap-2 pt-2">
      <Button variant="secondary" onClick={() => onPage(Math.max(1, page-1))} disabled={page===1}>Prev</Button>
      <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
      <Button variant="secondary" onClick={() => onPage(Math.min(totalPages, page+1))} disabled={page >= totalPages}>Next</Button>
    </div>
  );
}

