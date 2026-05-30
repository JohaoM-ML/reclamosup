'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { solicitarExamenFisicoAction } from '@/app/actions/reclamo.actions';

export function SolicitarExamenFisicoButton({
  reclamoId,
  yaSolicitado,
}: {
  reclamoId: string;
  yaSolicitado: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (yaSolicitado) {
    return (
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
        Solicitud de examen físico enviada a DAAR. Espere la entrega presencial.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-up-border p-4 bg-white">
      <h3 className="font-semibold text-up-text mb-2">Examen físico (opcional)</h3>
      <p className="text-sm text-up-text-secondary mb-3">
        Si necesita revisar el examen en papel, solicite la entrega a DAAR. La devolución
        virtual (PDF escaneado) sigue siendo la vía principal.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await solicitarExamenFisicoAction(reclamoId);
            if (res.ok) router.refresh();
          })
        }
        className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {pending ? 'Enviando...' : 'Solicitar entrega de examen físico'}
      </button>
    </div>
  );
}
