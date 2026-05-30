/** Compara semestres académicos: 2026-I < 2026-II < 2027-I */
export function compararSemestre(a: string, b: string): number {
  const parse = (s: string) => {
    const [year, period] = s.split('-');
    return { year: Number(year), period: period === 'II' ? 2 : 1 };
  };
  const pa = parse(a);
  const pb = parse(b);
  if (pa.year !== pb.year) return pa.year - pb.year;
  return pa.period - pb.period;
}

export function semestreSiguiente(semestre: string): string {
  const [yearStr, period] = semestre.split('-');
  const year = Number(yearStr);
  if (period === 'I') return `${year}-II`;
  return `${year + 1}-I`;
}

export function estaImpedidoParaSemestre(
  impedidoHastaSemestre: string | null | undefined,
  semestreCurso: string
): boolean {
  if (!impedidoHastaSemestre) return false;
  return compararSemestre(semestreCurso, impedidoHastaSemestre) <= 0;
}
