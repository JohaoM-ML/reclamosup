import type { Rol, EstadoReclamo } from '@/lib/types';

export const TRANSICIONES: Record<
  EstadoReclamo,
  Partial<Record<EstadoReclamo, Rol[]>>
> = {
  PENDIENTE_ESCANEO: { ENVIADO: ['daar'], RECHAZADO: ['daar'], ANULADO: ['daar'] },
  ENVIADO: { EN_REVISION: ['docente'], RECHAZADO: ['daar'], ANULADO: ['daar'] },
  EN_REVISION: { EN_VALIDACION: ['docente'], RECHAZADO: ['docente'] },
  EN_VALIDACION: { CERRADO: ['daar'], EN_REVISION: ['daar'] },
  CERRADO: {},
  RECHAZADO: {},
  ANULADO: {},
};

export function puedeTransicionar(
  desde: EstadoReclamo,
  hacia: EstadoReclamo,
  rol: Rol
): boolean {
  return TRANSICIONES[desde][hacia]?.includes(rol) ?? false;
}
