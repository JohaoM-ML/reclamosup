/**
 * Áreas académicas según prefijo de código UP en la oferta 2026-I.
 * Fuente: prisma/data/oferta-2026-1.json (prefijos 12–18).
 */
export const AREAS_OFERTA: Record<string, string> = {
  '12': 'Humanidades',
  '13': 'Ciencias Sociales',
  '14': 'Administración',
  '15': 'Economía',
  '16': 'Ingeniería',
  '17': 'Derecho',
  '18': 'Comunicaciones',
};

/** Prefijos presentes en la oferta académica cargada. */
export const PREFIJOS_OFERTA = Object.keys(AREAS_OFERTA);

export function departamentoDesdeCodigo(codigo: string): string {
  const prefijo = codigo.slice(0, 2);
  return AREAS_OFERTA[prefijo] ?? `Depto. ${prefijo}`;
}

export function prefijoDesdeCodigo(codigo: string): string {
  return codigo.slice(0, 2);
}

export function areaDesdePrefijo(prefijo: string): string | undefined {
  return AREAS_OFERTA[prefijo];
}
