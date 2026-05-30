'use client';

import { useActionState } from 'react';
import { loginAction, type ActionResult } from '@/app/actions/auth.actions';

const initial: ActionResult = { ok: false };

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">ReclamoUP</h1>
          <p className="text-gray-600 mt-2">
            Sistema de reclamos de evaluaciones — DAAR Pregrado
          </p>
        </div>

        <form
          action={action}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email institucional
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="usuario@alum.up.edu.pe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="demo123"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-indigo-600 py-2.5 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4 text-xs text-gray-600 space-y-2">
          <p className="font-semibold text-gray-800">Acceso demo</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Estudiante: jr.mendozaf@alum.up.edu.pe</li>
            <li>Docente: pa.tueroc@alum.up.edu.pe</li>
            <li>DAAR: Ap.Carhuavilcac@alum.up.edu.pe</li>
          </ul>
          <p className="text-gray-500 pt-1">
            Contraseña de todos los usuarios: <strong>demo123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
