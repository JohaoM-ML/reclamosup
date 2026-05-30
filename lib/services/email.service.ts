/**
 * Envío de correo vía Resend.
 * Sin RESEND_API_KEY: solo consola (dev).
 * EMAIL_DEMO_TO: redirige todos los envíos (útil si Resend aún no tiene dominio verificado).
 */
export async function sendEmailToUser(
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const from = process.env.EMAIL_FROM ?? 'reclamoup@up.edu.pe';
  const resendKey = process.env.RESEND_API_KEY;
  const demoTo = process.env.EMAIL_DEMO_TO?.trim();
  const destino = demoTo || to;
  const subjectFinal = demoTo ? `[Para: ${to}] ${subject}` : subject;
  const bodyFinal = demoTo
    ? `Destinatario original: ${to}\n\n${htmlBody}`
    : htmlBody;

  if (resendKey) {
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
        html: `<p>${bodyFinal.replace(/\n/g, '<br/>')}</p>`,
      }),
    });
    if (!res.ok) {
      console.warn('[email] Resend error:', await res.text());
      return;
    }
    console.log(`[email] Enviado a ${destino}${demoTo ? ` (redirigido desde ${to})` : ''} | ${subject}`);
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[email dev] To: ${destino} | ${subjectFinal}\n${bodyFinal}`);
  }
}
