/** Allowed CORS origins (HTTP + WebSocket). CORS_ORIGINS (comma separated) overrides the defaults. */
export function allowedOrigins(): (string | RegExp)[] | string {
  const envOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (envOrigins.length > 0) return envOrigins;
  // Restrictive by default; permissive (any origin) only when NODE_ENV === 'development'.
  return process.env.NODE_ENV === 'development'
    ? '*'
    : [
        'https://prosafe-admin-psi.vercel.app',
        'https://prosafe-admin-92x9gdh09-abdelkouddous-projects.vercel.app',
        'https://prosafe-admin.vercel.app',
        /^https:\/\/prosafe-admin-.*\.vercel\.app$/, // Vercel preview deployments
      ];
}
