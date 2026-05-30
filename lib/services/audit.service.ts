import { prisma } from '@/lib/db';
import type { EstadoReclamo } from '@/lib/types';

export async function logEvento(input: {
  reclamoId: string;
  actorId: string;
  accion: string;
  estadoAnterior?: EstadoReclamo | null;
  estadoNuevo?: EstadoReclamo | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.reclamoEvento.create({
    data: {
      reclamoId: input.reclamoId,
      actorId: input.actorId,
      accion: input.accion,
      estadoAnterior: input.estadoAnterior ?? null,
      estadoNuevo: input.estadoNuevo ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
