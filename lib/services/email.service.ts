import { emailHtml } from '@/lib/email-templates';

export type SendEmailResult = { ok: true; id?: string } | { ok: false; error: string };

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY?.trim();
}

/**
 * Envío de correo vía Resend.
 * Requiere RESEND_API_KEY + EMAIL_FROM (dominio verificado en Resend).
 * EMAIL_DEMO_TO: redirige todos los envíos (solo desarrollo / plan free sin dominio).
 */
export async function sendEmailToUser(
  to: string,
  subject: string,
  htmlBody: string,
  options?: { text?: string; linkUrl?: string; linkLabel?: string }
): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM ?? 'ReclamoUP <notificaciones@mail.reclamoup.uk>';
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const demoTo =
    process.env.NODE_ENV !== 'production'
      ? process.env.EMAIL_DEMO_TO?.trim()
      : undefined;
  const destino = demoTo || to;
  const subjectFinal = demoTo ? `[Para: ${to}] ${subject}` : subject;

  const html = options?.linkUrl
    ? emailHtml({
        titulo: subject,
        mensaje: demoTo ? `Destinatario original: ${to}\n\n${htmlBody}` : htmlBody,
        linkUrl: options.linkUrl,
        linkLabel: options.linkLabel,
      })
    : emailHtml({
        titulo: subject,
        mensaje: demoTo ? `Destinatario original: ${to}\n\n${htmlBody}` : htmlBody,
      });

  const text =
    options?.text ??
    (demoTo ? `Destinatario original: ${to}\n\n${htmlBody}` : htmlBody) +
      (options?.linkUrl ? `\n\nVer: ${options.linkUrl}` : '');

  if (!resendKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email dev] To: ${destino} | ${subjectFinal}\n${text}`);
    } else {
      console.warn('[email] RESEND_API_KEY no configurada — correo no enviado a', destino);
    }
    return { ok: false, error: 'RESEND_API_KEY no configurada' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: destino,
        subject: subjectFinal,
        html,
        text,
      }),
    });

    const body = await res.text();
    if (!res.ok) {
      console.warn('[email] Resend error:', body);
      return { ok: false, error: body };
    }

    let id: string | undefined;
    try {
      id = JSON.parse(body).id;
    } catch {
      /* ignore */
    }

    console.log(
      `[email] Enviado a ${destino}${demoTo ? ` (redirigido desde ${to})` : ''} | ${subject}`
    );
    return { ok: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de red';
    console.warn('[email] Error:', msg);
    return { ok: false, error: msg };
  }
}
