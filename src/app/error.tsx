"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }){
  return (
    <div className="mx-auto max-w-xl p-8 text-center">
      <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-gray-600 mb-4">{error.message}</p>
      <button onClick={reset} className="rounded-md bg-green-600 text-white px-4 py-2">Try again</button>
    </div>
  );
}
