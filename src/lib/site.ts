export function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || '';
  if (env.startsWith('http')) return env.replace(/\/$/, '');
  if (env) return `https://${env}`;
  return 'http://localhost:3000';
}

