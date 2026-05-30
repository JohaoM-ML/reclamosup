'use client';

import { useActionState } from 'react';
import { resolverReclamoAction, type ActionResult } from '@/app/actions/reclamo.actions';
import { inputClass, labelClass, RESULTADO_FINAL_LABELS } from '@/lib/types';

const initial: ActionResult = { ok: false };

export function ResolverForm({ reclamoId }: { reclamoId: string }) {
  const [state, action, pending] = useActionState(resolverReclamoAction, initial);

  return (
    <form action={action} className="space-y-4 rounded-lg border border-gray-200 p-4 bg-white">
      <h3 className="font-semibold text-gray-900">Resolver reclamo</h3>
      <input type="hidden" name="reclamoId" value={reclamoId} />

      <div>
        <label className={labelClass}>Resultado (Excel DAAR)</label>
        <select name="resultadoFinal" required className={inputClass}>
          <option value="">Seleccionar...</option>
          <option value="no_procede">{RESULTADO_FINAL_LABELS.no_procede}</option>
          <option value="procede_modifica">{RESULTADO_FINAL_LABELS.procede_modifica}</option>
          <option value="procede_sin_modifica">
            {RESULTADO_FINAL_LABELS.procede_sin_modifica}
          </option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Nota nueva (solo si procede y modifica)</label>
        <input
          name="notaNueva"
          type="number"
          step="0.1"
          min="0"
          max="20"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Comentario</label>
        <textarea
          name="comentario"
          required
          rows={3}
          className={inputClass}
          placeholder="Fundamento de la decisión..."
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-green-800 bg-green-50 p-2 rounded border border-green-200">
          Reclamo resuelto. Enviado a DAAR para cierre.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? 'Guardando...' : 'Registrar decisión'}
      </button>
    </form>
  );
}
