/**
 * Cursos con devolución/reclamo presencial en DAAR (no flujo digital estándar).
 * Fuente: entrevista DAAR + pautas UP.
 */
export const CURSOS_EXCLUIDOS_RECLAMO_DIGITAL = [
  'Matemáticas I',
  'Matemáticas II',
  'Estadística I',
] as const;

export function esCursoExcluidoReclamoDigital(nombreCurso: string): boolean {
  const n = nombreCurso.trim();
  return CURSOS_EXCLUIDOS_RECLAMO_DIGITAL.some(
    (excluido) => n === excluido || n.startsWith(`${excluido} `)
  );
}
