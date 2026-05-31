import { reclamoUrl } from '@/lib/app-url';
import { sendEmailToUser } from '@/lib/services/email.service';
import { prisma } from '@/lib/db';
import type { Rol } from '@/lib/types';

async function enviarCorreo(to: string, titulo: string, mensaje: string, link?: { url: string; label: string }) {
  const result = await sendEmailToUser(to, titulo, mensaje, {
    linkUrl: link?.url,
    linkLabel: link?.label,
  });
  if (!result.ok) {
    console.error(`[notificacion] Fallo correo a ${to}:`, result.error);
  }
  return result;
}

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
    select: { email: true, rol: true },
  });

  if (user?.email) {
    const linkUrl = input.reclamoId
      ? reclamoUrl(input.reclamoId, user.rol as 'estudiante' | 'docente' | 'daar')
      : undefined;
    await enviarCorreo(user.email, input.titulo, input.mensaje, linkUrl
      ? { url: linkUrl, label: 'Ver reclamo en ReclamoUP' }
      : undefined);
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
    const linkUrl = input.reclamoId ? reclamoUrl(input.reclamoId, rol) : undefined;
    await enviarCorreo(u.email, input.titulo, input.mensaje, linkUrl
      ? { url: linkUrl, label: 'Ver en panel DAAR' }
      : undefined);
  }
}
