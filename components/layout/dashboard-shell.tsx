import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth.actions';
import { getSession } from '@/lib/auth';
import { NotificationBell } from '@/components/layout/notification-bell';
import { ChatbotFlotante } from '@/components/estudiante/chatbot-flotante';
import { contarNotificacionesNoLeidas } from '@/lib/services/reclamo.service';

const NAV: Record<string, { href: string; label: string }[]> = {
  estudiante: [
    { href: '/estudiante', label: 'Mis reclamos' },
    { href: '/estudiante/cap/nuevo', label: 'Nuevo reclamo (CAP)' },
  ],
  docente: [{ href: '/docente', label: 'Bandeja' }],
  daar: [{ href: '/daar/dashboard', label: 'Dashboard' }],
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-indigo-700">
              ReclamoUP
            </Link>
            <nav className="flex gap-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-gray-600 hover:text-indigo-600"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell count={noLeidas} userId={session.id} />
            <span className="text-sm text-gray-600">
              {session.nombre}{' '}
              <span className="text-xs text-gray-400">({session.rol})</span>
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      {session.rol === 'estudiante' && <ChatbotFlotante />}
    </div>
  );
}
