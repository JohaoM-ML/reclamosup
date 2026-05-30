'use server';

import { requireRol } from '@/lib/auth';
import { getAppUrl } from '@/lib/app-url';
import { isEmailConfigured, sendEmailToUser } from '@/lib/services/email.service';

export async function enviarCorreoPruebaAction(formData: FormData) {
  await requireRol('daar');

  if (!isEmailConfigured()) {
    return { ok: false as const, error: 'RESEND_API_KEY no está configurada en el servidor.' };
  }

  const destino = String(formData.get('destino') ?? '').trim();
  if (!destino || !destino.includes('@')) {
    return { ok: false as const, error: 'Indique un correo válido.' };
  }

  const result = await sendEmailToUser(
    destino,
    'ReclamoUP — prueba de correo',
    'Si recibe este mensaje, el envío de notificaciones está activo.\n\nLos correos se envían automáticamente al registrar reclamos, resolver casos y cerrar reclamos.',
    {
      linkUrl: `${getAppUrl()}/daar/dashboard`,
      linkLabel: 'Abrir dashboard DAAR',
    }
  );

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return { ok: true as const, id: result.id };
}

export async function getEmailStatusAction() {
  await requireRol('daar');
  return {
    configured: isEmailConfigured(),
    from: process.env.EMAIL_FROM ?? '(no definido)',
    appUrl: getAppUrl(),
    demoRedirect: process.env.EMAIL_DEMO_TO?.trim() || null,
  };
}
