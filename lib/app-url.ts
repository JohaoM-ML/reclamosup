/** URL pública de la app (Vercel o local). */
export function getAppUrl(): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`;

  return 'http://localhost:3000';
}

export function reclamoUrl(reclamoId: string, rol: 'estudiante' | 'docente' | 'daar'): string {
  const base = getAppUrl();
  if (rol === 'estudiante') return `${base}/estudiante/${reclamoId}`;
  if (rol === 'docente') return `${base}/docente/${reclamoId}`;
  return `${base}/daar/${reclamoId}`;
}
