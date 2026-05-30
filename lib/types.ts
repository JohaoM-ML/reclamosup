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
  PENDIENTE_ESCANEO: 'bg-orange-100 text-orange-800',
  ENVIADO: 'bg-blue-100 text-blue-800',
  EN_REVISION: 'bg-yellow-100 text-yellow-800',
  EN_VALIDACION: 'bg-purple-100 text-purple-800',
  CERRADO: 'bg-green-100 text-green-800',
  RECHAZADO: 'bg-red-100 text-red-800',
  ANULADO: 'bg-gray-100 text-gray-700',
};

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  codigo?: string | null;
}

/** Clases compartidas para inputs legibles (texto oscuro) */
export const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 bg-white';
export const labelClass = 'block text-sm font-medium text-gray-900 mb-1';
