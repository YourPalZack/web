export default function Home() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-semibold">Welcome to AquaBuilder</h1>
      <p className="text-gray-600 mt-2">Start a build or browse parts to get recommendations and compatibility guidance.</p>
      <div className="mt-6 flex gap-3">
        <Link className="rounded-md bg-blue-600 text-white px-4 py-2" href="/build/new">Start a Build</Link>
        <Link className="rounded-md border px-4 py-2" href="/browse">Browse Parts</Link>
      </div>
    </div>
  );
}
import Link from 'next/link';
export const metadata = {
  title: 'Home',
  description: 'Design your aquarium build, check compatibility, and get the latest prices.',
  alternates: { canonical: '/' },
};
