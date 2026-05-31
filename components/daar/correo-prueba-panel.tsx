'use client';

import { useEffect, useState } from 'react';
import {
  enviarCorreoPruebaAction,
  getEmailStatusAction,
} from '@/app/actions/email.actions';

const DESTINOS_DEMO = [
  'jr.mendozaf@alum.up.edu.pe',
  'pa.tueroc@alum.up.edu.pe',
  'Ap.Carhuavilcac@alum.up.edu.pe',
];

export function CorreoPruebaPanel() {
  const [destino, setDestino] = useState(DESTINOS_DEMO[0]);
  const [status, setStatus] = useState<Awaited<ReturnType<typeof getEmailStatusAction>> | null>(
    null
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getEmailStatusAction().then(setStatus).catch(() => null);
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    setError(null);
    const fd = new FormData();
    fd.set('destino', destino);
    const res = await enviarCorreoPruebaAction(fd);
    setLoading(false);
    if (res.ok) {
      setMensaje(`Correo enviado a ${destino}${res.id ? ` (id: ${res.id})` : ''}.`);
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-up-text">Correo (Resend)</h3>
        <p className="text-xs text-up-text-muted mt-1">
          Notificaciones automáticas al registrar, resolver y cerrar reclamos. Los correos
          institucionales demo (@alum.up.edu.pe) son ficticios: use una copia real abajo o
          cambie los emails demo en la base de datos.
        </p>
      </div>

      {status && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-up-text-muted">Estado</dt>
            <dd className={status.configured ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
              {status.configured ? 'Configurado' : 'Sin API key'}
            </dd>
          </div>
          <div>
            <dt className="text-up-text-muted">Remitente</dt>
            <dd className="font-mono text-up-text truncate">{status.from}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-up-text-muted">URL app (enlaces en correo)</dt>
            <dd className="font-mono text-up-text truncate">{status.appUrl}</dd>
          </div>
          {status.copyTo && (
            <div className="sm:col-span-2">
              <dt className="text-up-text-muted">Copia a (EMAIL_COPY_TO)</dt>
              <dd className="text-green-700 font-mono">{status.copyTo}</dd>
            </div>
          )}
          {status.demoRedirect && (
            <div className="sm:col-span-2">
              <dt className="text-up-text-muted">Redirección demo</dt>
              <dd className="text-amber-700">{status.demoRedirect}</dd>
            </div>
          )}
        </dl>
      )}

      <form onSubmit={enviar} className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-up-text-secondary mb-1">Enviar prueba a</label>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="w-full rounded-md border border-up-border px-3 py-1.5 text-sm"
          >
            {DESTINOS_DEMO.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !status?.configured}
          className="rounded-md bg-up-blue px-4 py-1.5 text-sm font-medium text-white hover:bg-up-blue-hover disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Enviar prueba'}
        </button>
      </form>

      {mensaje && <p className="text-xs text-green-700">{mensaje}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
