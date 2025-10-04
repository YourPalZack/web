import { prisma } from '@aquabuilder/db';
import { Card, CardHeader, CardTitle, CardContent, PriceSparkline } from '@aquabuilder/ui';
import { compatibilityScore } from '@aquabuilder/core';

export default async function BuildPage({ params }: { params: { id: string } }) {
  const build = await prisma.userBuild.findUnique({ where: { id: params.id } });
  if (!build) return <div className="p-6">Not found</div>;

  type BuildComponents = {
    tank?: { volumeGal?: number };
    equipment?: { filter?: string; heater?: string; light?: string };
    livestock?: { type: string; id: string; qty: number }[];
  };
  const items = (build.components as unknown as BuildComponents) ?? {};
  const warnings: { level: 'WARN'|'BLOCK' }[] = []; // TODO: recompute server-side similarly to wizard
  const score = compatibilityScore(warnings);

  // Fetch sparkline data for a selected filter if present
  let spark = [] as { t: string; price: number }[];
  if (items?.equipment?.filter) {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/prices/FILTER/${items.equipment.filter}`, { cache: 'no-store' });
    if (res.ok) {
      const rows = (await res.json()) as { timestamp: string; priceCents: number }[];
      spark = rows.slice(-30).map((r) => ({ t: r.timestamp, price: r.priceCents / 100 }));
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{build.name}</h1>
        <div className="text-sm text-gray-600">Score: <span className="font-semibold">{score}</span></div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
            <CardHeader><CardTitle>Parts</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Tank</div>
                <div className="font-medium">{items?.tank?.volumeGal ? `${items.tank.volumeGal} gal` : '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Filter</div>
                <div className="font-medium">{items?.equipment?.filter ?? '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Heater</div>
                <div className="font-medium">{items?.equipment?.heater ?? '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Light</div>
                <div className="font-medium">{items?.equipment?.light ?? '—'}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
            <CardHeader><CardTitle>Livestock</CardTitle></CardHeader>
            <CardContent>
              {(!items.livestock || items.livestock.length === 0) ? (
                <div className="text-sm text-gray-600">None</div>
              ) : (
                <ul className="text-sm space-y-1">
                  {items.livestock!.map((l) => (
                    <li key={`${l.type}-${l.id}`}>{l.type}: {l.id} × {l.qty}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
            <CardHeader><CardTitle>Price Trend</CardTitle></CardHeader>
            <CardContent>{spark.length ? <PriceSparkline data={spark} /> : <div className="text-sm text-gray-600">No price data.</div>}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
