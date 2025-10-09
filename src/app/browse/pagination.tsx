"use client";

export default function Pagination({ page, total, pageSize, makeHref }:{ page:number; total:number; pageSize:number; makeHref:(p:number)=>string }){
  const last = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.max(1, page - 2);
  const end = Math.min(last, page + 2);
  const nums: number[] = []; for (let i=start; i<=end; i++) nums.push(i);
  return (
    <div className="col-span-full pt-2 text-xs flex justify-between items-center">
      <a className={`px-2 py-1 border rounded ${page<=1?'pointer-events-none opacity-50':''}`} href={makeHref(Math.max(1, page-1))}>Prev</a>
      <div className="flex items-center gap-1">
        {start>1 && <a className="px-2 py-1 border rounded" href={makeHref(1)}>1</a>}
        {start>2 && <span className="px-1">…</span>}
        {nums.map(n => n===page ? (
          <span key={n} className="px-2 py-1 border rounded bg-gray-100" aria-current="page">{n}</span>
        ) : (
          <a key={n} className="px-2 py-1 border rounded" href={makeHref(n)}>{n}</a>
        ))}
        {end<last-1 && <span className="px-1">…</span>}
        {end<last && <a className="px-2 py-1 border rounded" href={makeHref(last)}>{last}</a>}
      </div>
      <a className={`px-2 py-1 border rounded ${page>=last?'pointer-events-none opacity-50':''}`} href={makeHref(Math.min(last, page+1))}>Next</a>
    </div>
  );
}
