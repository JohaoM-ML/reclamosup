import { sendEmailToUser } from '@/lib/services/email.service';
import { prisma } from '@/lib/db';
import type { Rol } from '@/lib/types';

export async function sendNotification(input: {
  userId: string;
  reclamoId?: string;
  titulo: string;
  mensaje: string;
}) {
  await prisma.notificacion.create({
    data: {
      usuarioId: input.userId,
      reclamoId: input.reclamoId,
      titulo: input.titulo,
      mensaje: input.mensaje,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true },
  });
  if (user?.email) {
    await sendEmailToUser(user.email, input.titulo, input.mensaje);
  }
}

export async function sendToRole(
  rol: Rol,
  input: { reclamoId?: string; titulo: string; mensaje: string }
) {
  const users = await prisma.user.findMany({ where: { rol } });
  await prisma.notificacion.createMany({
    data: users.map((u) => ({
      usuarioId: u.id,
      reclamoId: input.reclamoId,
      titulo: input.titulo,
      mensaje: input.mensaje,
    })),
  });

  for (const u of users) {
    await sendEmailToUser(u.email, input.titulo, input.mensaje);
  }
}
