'use client';

import { useState, useTransition } from 'react';
import { rechazarPorLapizDocenteAction } from '@/app/actions/reclamo.actions';
import { ResolverForm } from '@/components/reclamos/resolver-form';

export function LapizConfirmacionGate({ reclamoId }: { reclamoId: string }) {
  const [confirmado, setConfirmado] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleRechazar() {
    startTransition(async () => {
      await rechazarPorLapizDocenteAction(reclamoId);
    });
  }

  if (confirmado) {
    return <ResolverForm reclamoId={reclamoId} />;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-4">
      <p className="text-sm text-gray-900">
        El estudiante declaró que su examen <strong>NO</strong> fue hecho con lápiz. ¿Confirmas
        que el examen <strong>NO</strong> está hecho con lápiz?
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setConfirmado(true)}
          disabled={pending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Sí, confirmo — sin lápiz
        </button>
        <button
          type="button"
          onClick={handleRechazar}
          disabled={pending}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? 'Procesando...' : 'Sí, tiene lápiz'}
        </button>
      </div>
    </div>
  );
}
