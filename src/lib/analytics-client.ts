export async function logEventClient(name: string, props: Record<string, any> = {}) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[analytics:client]', name, props);
    }
    const payload = JSON.stringify({ name, props });
    if ('sendBeacon' in navigator) {
      const blob = new Blob([payload], { type: 'application/json' });
      (navigator as any).sendBeacon('/api/analytics', blob);
      return;
    }
    void fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
  } catch {}
}

// Back-compat alias used across client components
export const logEvent = logEventClient;
