import type { EstadoReclamo } from '@/lib/types';
import { ESTADO_COLORS, ESTADO_LABELS } from '@/lib/types';

export function EstadoBadge({ estado }: { estado: string }) {
  const e = estado as EstadoReclamo;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[e] ?? 'bg-gray-100 text-gray-800'}`}
    >
      {ESTADO_LABELS[e] ?? estado}
    </span>
  );
}
