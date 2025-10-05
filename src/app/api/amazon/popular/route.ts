import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { searchItemsViaPaapi } from '../../../../lib/amazon';

const CategorySchema = z.enum(['filters','heaters','lights','substrate','equipment']);
const QuerySchema = z.object({
  category: CategorySchema,
  limit: z.coerce.number().int().positive().max(10).default(6),
});

function toKeywords(category: z.infer<typeof CategorySchema>): { keywords: string; searchIndex?: string } {
  switch (category) {
    case 'filters': return { keywords: 'aquarium filter', searchIndex: 'PetSupplies' };
    case 'heaters': return { keywords: 'aquarium heater', searchIndex: 'PetSupplies' };
    case 'lights': return { keywords: 'aquarium light LED', searchIndex: 'PetSupplies' };
    case 'substrate': return { keywords: 'aquarium substrate', searchIndex: 'PetSupplies' };
    case 'equipment': return { keywords: 'aquarium air pump', searchIndex: 'PetSupplies' };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      category: searchParams.get('category'),
      limit: searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid query', issues: parsed.error.format() }, { status: 400 });
    const { category, limit } = parsed.data;
    const kw = toKeywords(category);
    const items = await cachedSearch({ key: `${category}:${limit}`, keywords: kw.keywords, searchIndex: kw.searchIndex, limit });
    const res = NextResponse.json(items);
    res.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Amazon error';
    // Hide details in prod but keep response shape consistent
    return NextResponse.json({ error: 'Amazon fetch failed', message }, { status: 502 });
  }
}

// simple in-memory cache per process
const cache = new Map<string, { at: number; items: unknown[] }>();
const TTL_MS = 10 * 60 * 1000; // 10 minutes
async function cachedSearch(args: { key: string; keywords: string; searchIndex?: string; limit: number }) {
  const now = Date.now();
  const hit = cache.get(args.key);
  if (hit && now - hit.at < TTL_MS) return hit.items;
  const items = await searchItemsViaPaapi({ keywords: args.keywords, searchIndex: args.searchIndex, limit: args.limit });
  cache.set(args.key, { at: now, items });
  return items;
}
export const runtime = 'nodejs';
