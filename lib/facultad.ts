import { AREAS_OFERTA, departamentoDesdeCodigo } from '@/lib/departamento';

/** En dashboards DAAR, la facultad coincide con el área de la oferta académica. */
export function facultadDesdeDepartamento(departamento: string): string {
  const areas = Object.values(AREAS_OFERTA);
  if (areas.includes(departamento)) return departamento;
  if (departamento.startsWith('Depto.')) return 'Otros';
  return departamento;
}

export function facultadDesdeCodigoCurso(codigo: string): string {
  return facultadDesdeDepartamento(departamentoDesdeCodigo(codigo));
}

/** Orden de facultades según prefijos de la oferta (12 → 18). */
export const FACULTADES_ORDEN = [
  ...Object.values(AREAS_OFERTA),
  'Otros',
] as const;
