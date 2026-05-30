'use client';

import { useActionState } from 'react';
import { loginAction, type ActionResult } from '@/app/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initial: ActionResult = { ok: false };

const DEMO_ACCOUNTS = [
  { label: 'Estudiante', email: 'jr.mendozaf@alum.up.edu.pe' },
  { label: 'Docente', email: 'pa.tueroc@alum.up.edu.pe' },
  { label: 'DAAR', email: 'Ap.Carhuavilcac@alum.up.edu.pe' },
];

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#00205B] via-[#003875] to-[#001433]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5 md:px-10">
          <div>
            <p className="text-lg font-bold tracking-tight text-white">ReclamoUP</p>
            <p className="text-xs text-white/70">Universidad del Pacífico</p>
          </div>
          <p className="hidden text-right text-xs text-white/70 sm:block">
            Plataforma de reclamos
            <br />
            DAAR Pregrado
          </p>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-10">
          <div className="w-full max-w-md">
            <form action={action} className="space-y-5">
              <Input
                dark
                label="Email institucional"
                name="email"
                type="email"
                required
                placeholder="usuario@alum.up.edu.pe"
                autoComplete="username"
              />
              <Input
                dark
                label="Contraseña"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />

              {state.error && (
                <p className="rounded-md border border-red-300/40 bg-red-500/20 px-3 py-2 text-sm text-white">
                  {state.error}
                </p>
              )}

              <Button
                type="submit"
                variant="orange"
                size="lg"
                disabled={pending}
                className="w-full uppercase tracking-wide"
              >
                {pending ? 'Entrando...' : 'Iniciar sesión'}
              </Button>
            </form>

            <div className="mt-8 rounded-lg border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/80">
                Acceso demo — hackathon
              </p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      const form = document.querySelector('form');
                      const emailInput = form?.querySelector<HTMLInputElement>(
                        'input[name="email"]'
                      );
                      const passInput = form?.querySelector<HTMLInputElement>(
                        'input[name="password"]'
                      );
                      if (emailInput) emailInput.value = acc.email;
                      if (passInput) passInput.value = 'demo123';
                    }}
                    className="flex w-full items-center justify-between rounded-md border border-white/10 px-3 py-2 text-left text-xs text-white/90 transition-colors hover:border-white/25 hover:bg-white/10"
                  >
                    <span className="font-medium">{acc.label}</span>
                    <span className="truncate pl-2 text-white/60">{acc.email}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-white/50">Contraseña: demo123</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
