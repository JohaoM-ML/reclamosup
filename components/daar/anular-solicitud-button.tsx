'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { anularReclamoDaarAction } from '@/app/actions/reclamo.actions';

export function AnularSolicitudButton({ reclamoId }: { reclamoId: string }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await anularReclamoDaarAction(reclamoId);
      if (result.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        setError(result.error ?? 'Error al anular');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
      >
        Anular solicitud
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Anular solicitud</h3>
            <p className="text-sm text-gray-800">
              ¿Seguro que deseas anular esta solicitud? El estudiante deberá registrarla
              nuevamente.
            </p>
            {error && (
              <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={pending}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? 'Anulando...' : 'Confirmar anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
