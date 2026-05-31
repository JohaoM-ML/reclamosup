import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth.actions';
import { getSession } from '@/lib/auth';
import { NotificationBell } from '@/components/layout/notification-bell';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { ChatbotFlotante } from '@/components/estudiante/chatbot-flotante';
import { contarNotificacionesNoLeidas, getHistorialDocente } from '@/lib/services/reclamo.service';
import { DocenteSidebarHistorial } from '@/components/docente/docente-historial';

const NAV: Record<string, { href: string; label: string }[]> = {
  estudiante: [
    { href: '/estudiante', label: 'Mis reclamos' },
    { href: '/estudiante/cap/nuevo', label: 'Nuevo reclamo (CAP)' },
  ],
  docente: [
    { href: '/docente', label: 'Bandeja de reclamos' },
    { href: '/docente/historial', label: 'Historial de reclamos' },
  ],
  daar: [{ href: '/daar/dashboard', label: 'Dashboard analítico' }],
};

const ROL_LABEL: Record<string, string> = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  daar: 'DAAR Pregrado',
};

export async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) return null;

  const noLeidas = await contarNotificacionesNoLeidas(session.id);
  const links = NAV[session.rol] ?? [];
  const historialDocente =
    session.rol === 'docente' ? await getHistorialDocente(session.id, 6) : [];

  return (
    <div className="flex min-h-screen bg-up-surface-muted">
      <aside className="hidden w-64 shrink-0 flex-col bg-up-navy lg:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <Link href="/" className="block">
            <p className="text-lg font-bold text-white">ReclamoUP</p>
            <p className="mt-0.5 text-xs text-white/60">Universidad del Pacífico</p>
          </Link>
        </div>

        <div className="flex-1 px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Navegación
          </p>
          <SidebarNav links={links} />
          {session.rol === 'docente' && (
            <DocenteSidebarHistorial reclamos={historialDocente} />
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-5 text-xs text-white/60">
          <p className="font-medium text-white/80">DAAR Pregrado</p>
          <p className="mt-1">Sistema de reclamos de evaluaciones</p>
          <p className="mt-3 text-white/40">Semestre 2026-I</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-up-border bg-up-surface">
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
            <div className="lg:hidden">
              <Link href="/" className="text-base font-bold text-up-navy">
                ReclamoUP
              </Link>
            </div>

            <div className="hidden flex-wrap gap-2 lg:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-3 py-1.5 text-sm text-up-text-secondary hover:bg-up-surface-muted hover:text-up-blue"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3">
              <NotificationBell count={noLeidas} userId={session.id} />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-up-text">{session.nombre}</p>
                <p className="text-xs text-up-text-muted">
                  {ROL_LABEL[session.rol] ?? session.rol}
                </p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-up-border px-3 py-1.5 text-xs font-medium text-up-text-secondary transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-up-border bg-up-surface px-4 py-2 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="shrink-0 rounded-md bg-up-surface-muted px-3 py-1.5 text-xs font-semibold text-up-navy hover:bg-up-blue/10"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      {session.rol === 'estudiante' && <ChatbotFlotante />}
    </div>
  );
}
