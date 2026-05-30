import type { DecisionReclamo, ResultadoFinal } from '@/lib/types';

export function calcularResultadoFinal(
  decision: DecisionReclamo | null | undefined,
  notaAnterior: number,
  notaNueva: number | null | undefined
): ResultadoFinal | null {
  if (!decision) return null;
  if (decision === 'no_procedente') return 'no_procede';
  if (notaNueva == null) return 'procede_modifica';
  if (notaNueva !== notaAnterior) return 'procede_modifica';
  return 'procede_sin_modifica';
}

export function decisionDesdeResultado(
  resultado: ResultadoFinal,
  notaAnterior: number,
  notaNuevaInput?: number
): { decision: DecisionReclamo; notaNueva?: number } {
  if (resultado === 'no_procede') {
    return { decision: 'no_procedente' };
  }
  if (resultado === 'procede_sin_modifica') {
    return { decision: 'procedente', notaNueva: notaAnterior };
  }
  return { decision: 'procedente', notaNueva: notaNuevaInput };
}
