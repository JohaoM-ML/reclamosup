'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { solicitarExamenFisicoAction } from '@/app/actions/reclamo.actions';
import { Button } from '@/components/ui/button';

type Solicitud = {
  id: string;
  solicitadoAt: Date | string;
  entregadoAt: Date | string | null;
} | null;

const ESTADOS_ACTIVOS = new Set(['ENVIADO', 'EN_REVISION', 'EN_VALIDACION']);

function formatFecha(value: Date | string) {
  return new Date(value).toLocaleString('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function SolicitarExamenFisicoButton({
  reclamoId,
  estado,
  solicitud,
}: {
  reclamoId: string;
  estado: string;
  solicitud: Solicitud;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const puedeSolicitar = ESTADOS_ACTIVOS.has(estado) && !solicitud;

  if (!puedeSolicitar && !solicitud) {
    return null;
  }

  if (solicitud) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-up-navy">Examen físico</h3>
        {solicitud.entregadoAt ? (
          <p className="text-sm text-emerald-800">
            DAAR registró la entrega el {formatFecha(solicitud.entregadoAt)}.
          </p>
        ) : (
          <p className="text-sm text-up-text">
            Solicitud enviada el {formatFecha(solicitud.solicitadoAt)}. DAAR coordinará la
            entrega del examen físico.
          </p>
        )}
      </div>
    );
  }

  function handleConfirm() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const result = await solicitarExamenFisicoAction(reclamoId);
      if (result.ok) {
        setOk(true);
        setShowModal(false);
        router.refresh();
      } else {
        setError(result.error ?? 'No se pudo enviar la solicitud');
      }
    });
  }

  return (
    <>
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-up-navy">Examen físico</h3>
          <p className="mt-1 text-sm text-up-text-secondary">
            Si necesita revisar el examen en papel, solicite a DAAR la entrega física. Se
            notificará al equipo DAAR.
          </p>
        </div>
        {ok && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">
            Solicitud enviada correctamente.
          </p>
        )}
        <Button type="button" variant="outline" className="w-full" onClick={() => setShowModal(true)}>
          Solicitar examen físico a DAAR
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-up-text">Solicitar examen físico</h3>
            <p className="text-sm text-up-text">
              DAAR recibirá una notificación para coordinar la entrega del examen en papel. ¿Desea
              continuar?
            </p>
            {error && (
              <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={pending}
                className="rounded-md border border-up-border px-4 py-2 text-sm text-up-text-secondary hover:bg-up-surface-muted disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="rounded-md bg-up-blue px-4 py-2 text-sm font-medium text-white hover:bg-up-blue-hover disabled:opacity-50"
              >
                {pending ? 'Enviando...' : 'Confirmar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
