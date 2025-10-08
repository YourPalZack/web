"use client";
import Head from 'next/head';

export default function PaginationHead({
  page,
  pageSize,
  total,
  type,
}:{ page: number; pageSize: number; total: number; type?: string }){
  const lastPage = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  const base = '/community';
  const qs = (p: number) => {
    const sp = new URLSearchParams();
    if (type) sp.set('type', type);
    if (p > 1) sp.set('page', String(p));
    const s = sp.toString();
    return s ? `${base}?${s}` : base;
  };
  const prevHref = page > 1 ? qs(page - 1) : null;
  const nextHref = page < lastPage ? qs(page + 1) : null;
  if (!prevHref && !nextHref) return null;
  return (
    <Head>
      {prevHref ? <link rel="prev" href={prevHref} /> : null}
      {nextHref ? <link rel="next" href={nextHref} /> : null}
    </Head>
  );
}

