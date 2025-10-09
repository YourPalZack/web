import Link from 'next/link';
import HomePageView from './page-view';

export default function Home() {
  return (
    <div>
      <HomePageView />
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-400/20 to-emerald-300/20">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-4xl font-semibold tracking-tight">Plan, price, and share your aquarium build</h1>
          <p className="text-lg text-gray-600 mt-2 max-w-2xl">Get compatible recommendations, track prices with affiliate links, and explore community builds.</p>
          <div className="mt-6 flex gap-3">
            <Link className="rounded-md bg-green-600 text-white px-4 py-2" href="/build/new">Start a Build</Link>
            <Link className="rounded-md border px-4 py-2" href="/browse">Browse Parts</Link>
          </div>
        </div>
      </section>
      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-xl font-semibold">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-4 mt-4 text-sm">
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="font-medium">1. Configure your tank</div>
            <div className="text-gray-600">Pick tank size and equipment, and add livestock.</div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="font-medium">2. Check compatibility</div>
            <div className="text-gray-600">See bioload and parameter guidance with clear warnings.</div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="font-medium">3. Track prices</div>
            <div className="text-gray-600">Compare retailer offers and set price alerts.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
export const metadata = {
  title: 'Home',
  description: 'Design your aquarium build, check compatibility, and get the latest prices.',
  alternates: { canonical: '/' },
};
