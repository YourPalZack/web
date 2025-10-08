"use client";
import { useMemo, useState } from 'react';
import { PriceSparkline, Chip } from '@aquabuilder/ui';

type Pt = { t: string; price: number }[];

export default function SparklinePanel({ data }: { data: Pt }){
  const [range, setRange] = useState<'7'|'30'|'90'|'all'>('30');
  const sliced = useMemo(()=>{
    if (range==='all') return data;
    const n = range==='7' ? 7 : range==='30' ? 30 : 90;
    return data.slice(-n);
  }, [data, range]);
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {(['7','30','90','all'] as const).map((r)=> (
          <Chip key={r} active={range===r} onClick={()=> setRange(r)}>{r==='all' ? 'All' : `${r}d`}</Chip>
        ))}
      </div>
      <PriceSparkline data={sliced} />
    </div>
  );
}

