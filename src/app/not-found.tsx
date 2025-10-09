import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl p-10 text-center space-y-4">
      <h1 className="text-3xl font-semibold">Page Not Found</h1>
      <p className="text-gray-600">Sorry, we couldn’t find that page.</p>
      <div className="flex gap-3 justify-center">
        <Link className="rounded-md bg-green-600 text-white px-4 py-2" href="/">Home</Link>
        <Link className="rounded-md border px-4 py-2" href="/browse">Browse Parts</Link>
      </div>
    </div>
  );
}
