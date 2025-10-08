import { searchItemsViaPaapi } from '../../lib/amazon';
import Image from 'next/image';
import { JsonLd } from '../../lib/structured';
import AmazonTrackLink from './amazon-track-link';

export default async function AmazonPopularSSR({ category, limit=4 }:{ category: 'filters'|'heaters'|'lights'|'substrate'|'equipment'; limit?: number }) {
  try {
    const items = await searchItemsViaPaapi({ keywords: keywordsFor(category), searchIndex: 'PetSupplies', limit });
    if (!items?.length) return null;
    return (
      <div className="col-span-full mt-2">
        <div className="text-xs text-gray-600 mb-2">Popular on Amazon</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((it)=> (
            <div key={it.asin} className="border rounded-2xl p-3 flex gap-3 items-center">
              {it.image && (
                <Image src={it.image} alt={it.title ?? it.asin} width={64} height={64} className="object-contain" />
              )}
              <div className="min-w-0">
                <AmazonTrackLink href={it.url ?? '#'} meta={{ asin: it.asin, category }}>
                  <span className="text-sm truncate block hover:underline">{it.title ?? it.asin}</span>
                </AmazonTrackLink>
                <div className="text-xs text-gray-600">{typeof it.priceCents==='number' ? `$${(it.priceCents/100).toFixed(2)}` : 'View price'}</div>
              </div>
              {/* Product structured data */}
              <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: it.title ?? it.asin,
                image: it.image,
                sku: it.asin,
                brand: 'Amazon',
                offers: {
                  '@type': 'Offer',
                  priceCurrency: 'USD',
                  price: typeof it.priceCents==='number' ? (it.priceCents/100).toFixed(2) : undefined,
                  availability: 'https://schema.org/InStock',
                  url: it.url,
                },
              }} />
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-500 mt-2">As an Amazon Associate, we earn from qualifying purchases.</div>
      </div>
    );
  } catch {
    return null;
  }
}

function keywordsFor(category: 'filters'|'heaters'|'lights'|'substrate'|'equipment'): string {
  switch (category) {
    case 'filters': return 'aquarium filter';
    case 'heaters': return 'aquarium heater';
    case 'lights': return 'aquarium light LED';
    case 'substrate': return 'aquarium substrate';
    case 'equipment': return 'aquarium air pump';
  }
}
