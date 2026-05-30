export function emailHtml(input: {
  titulo: string;
  mensaje: string;
  linkUrl?: string;
  linkLabel?: string;
}): string {
  const linkBlock = input.linkUrl
    ? `<p style="margin:24px 0 0">
        <a href="${input.linkUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px">
          ${input.linkLabel ?? 'Ver en ReclamoUP'}
        </a>
      </p>
      <p style="margin:12px 0 0;font-size:12px;color:#6b7280">${input.linkUrl}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:8px;border:1px solid #e5e7eb" cellpadding="0" cellspacing="0">
        <tr><td style="padding:24px 24px 8px;border-bottom:1px solid #f3f4f6">
          <strong style="font-size:18px;color:#111827">ReclamoUP</strong>
          <span style="font-size:12px;color:#6b7280;margin-left:8px">DAAR Pregrado</span>
        </td></tr>
        <tr><td style="padding:24px">
          <h1 style="margin:0 0 12px;font-size:16px;color:#111827">${escapeHtml(input.titulo)}</h1>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap">${escapeHtml(input.mensaje)}</p>
          ${linkBlock}
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f9fafb;border-radius:0 0 8px 8px;font-size:11px;color:#9ca3af">
          Universidad del Pacífico — notificación automática. No responda a este correo.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
