type EventProps = Record<string, any>;

export async function logEvent(name: string, props: EventProps = {}) {
  try {
    // Placeholder: wire PostHog or analytics provider later
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', name, props);
    }
  } catch {
    // swallow
  }
}

