export type Rol = 'estudiante' | 'docente' | 'daar';

export type EstadoReclamo =
  | 'PENDIENTE_ESCANEO'
  | 'ENVIADO'
  | 'EN_REVISION'
  | 'EN_VALIDACION'
  | 'CERRADO'
  | 'RECHAZADO'
  | 'ANULADO';

export type MotivoReclamo = 'error_suma' | 'revision_integral' | 'otro';

export type DecisionReclamo = 'procedente' | 'no_procedente';

export type ResultadoFinal =
  | 'no_procede'
  | 'procede_modifica'
  | 'procede_sin_modifica';

export const RESULTADO_FINAL_LABELS: Record<ResultadoFinal, string> = {
  no_procede: 'No procede',
  procede_modifica: 'Procede y modifica',
  procede_sin_modifica: 'Procede y NO modifica',
};

export const ESTADO_LABELS: Record<EstadoReclamo, string> = {
  PENDIENTE_ESCANEO: 'Pendiente escaneo (legacy)',
  ENVIADO: 'Enviado al docente',
  EN_REVISION: 'En revisión',
  EN_VALIDACION: 'En validación DAAR',
  CERRADO: 'Concluido',
  RECHAZADO: 'Rechazado',
  ANULADO: 'Anulado',
};

export const MOTIVO_LABELS: Record<MotivoReclamo, string> = {
  error_suma: 'Error de suma',
  revision_integral: 'Revisión integral',
  otro: 'Otro',
};

export const ESTADO_COLORS: Record<EstadoReclamo, string> = {
  PENDIENTE_ESCANEO: 'bg-up-orange/15 text-amber-900',
  ENVIADO: 'bg-up-blue/10 text-up-navy',
  EN_REVISION: 'bg-amber-100 text-amber-900',
  EN_VALIDACION: 'bg-violet-100 text-violet-900',
  CERRADO: 'bg-emerald-100 text-emerald-900',
  RECHAZADO: 'bg-red-100 text-red-800',
  ANULADO: 'bg-up-surface-muted text-up-text-muted',
};

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  codigo?: string | null;
}

/** Clases compartidas — paleta UP institucional */
export const inputClass =
  'w-full rounded-[6px] border border-up-border px-3 py-2 text-sm text-up-text placeholder:text-up-text-muted bg-up-surface focus:border-up-blue focus:outline-none focus:ring-2 focus:ring-up-blue/20';
export const labelClass = 'block text-sm font-semibold text-up-text-secondary mb-1';
export const tableHeadClass =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-up-text-secondary';
export const tableCellClass = 'px-4 py-3 text-sm text-up-text';
export const linkClass = 'text-sm font-medium text-up-blue hover:underline';
