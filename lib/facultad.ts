/** Mapeo departamento académico → facultad para dashboards DAAR. */
const MAPA: Record<string, string> = {
  Ingeniería: 'Ingeniería',
  Matemáticas: 'Ciencias',
  General: 'Ciencias',
  Administración: 'Negocios',
  Economía: 'Negocios',
  Humanidades: 'Humanidades',
  Comunicaciones: 'Humanidades',
  'Ciencias Sociales': 'Humanidades',
  Derecho: 'Derecho',
};

export function facultadDesdeDepartamento(departamento: string): string {
  return MAPA[departamento] ?? 'Otros';
}

export const FACULTADES_ORDEN = [
  'Ingeniería',
  'Ciencias',
  'Negocios',
  'Humanidades',
  'Derecho',
  'Medicina',
  'Otros',
] as const;
