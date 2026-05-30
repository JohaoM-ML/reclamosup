/** Inicio del ciclo académico (lunes semana 1) por semestre. */
const INICIO_CICLO: Record<string, string> = {
  '2026-I': '2026-03-02',
  '2026-II': '2026-08-03',
};

export const CICLO_TOTAL_SEMANAS = 9;
export const PLAZO_DOCENTE_DIAS = 7;
export const META_RESOLUCION_DIAS = 5;
export const META_RESPUESTA_DOCENTE_DIAS = 2;
export const SLA_CIERRE_DIAS = 5;

export function inicioCiclo(semestre: string): Date {
  const iso = INICIO_CICLO[semestre] ?? INICIO_CICLO['2026-I'];
  return new Date(iso + 'T00:00:00');
}

export function semanaDelCiclo(fecha: Date, semestre: string): number {
  const inicio = inicioCiclo(semestre);
  const diffMs = fecha.getTime() - inicio.getTime();
  const semana = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(CICLO_TOTAL_SEMANAS, semana));
}

export function etiquetasSemanas(): string[] {
  return Array.from({ length: CICLO_TOTAL_SEMANAS }, (_, i) => `S${i + 1}`);
}

export function diasEntre(desde: Date, hasta: Date): number {
  return (hasta.getTime() - desde.getTime()) / (24 * 60 * 60 * 1000);
}

export function bucketDiasResolucion(dias: number): string {
  if (dias <= 2) return '1-2';
  if (dias <= 5) return '3-5';
  if (dias <= 10) return '6-10';
  return '+10';
}
