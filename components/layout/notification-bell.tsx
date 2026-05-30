import { getNotificaciones } from '@/lib/services/reclamo.service';
import { marcarLeidaAction } from '@/app/actions/reclamo.actions';

export async function NotificationBell({
  count,
  userId,
}: {
  count: number;
  userId: string;
}) {
  const notificaciones = await getNotificaciones(userId);

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none flex items-center gap-1 text-sm text-up-text-secondary">
        🔔
        {count > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-[1.25rem] text-center">
            {count}
          </span>
        )}
      </summary>
      <div className="absolute right-0 mt-2 w-80 bg-white border border-up-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
        {notificaciones.length === 0 ? (
          <p className="p-4 text-sm text-up-text-muted">Sin notificaciones</p>
        ) : (
          <ul className="divide-y divide-up-border">
            {notificaciones.map((n) => (
              <li
                key={n.id}
                className={`p-3 text-sm ${n.leida ? 'bg-white' : 'bg-up-blue/5'}`}
              >
                <p className="font-medium text-up-text">{n.titulo}</p>
                <p className="text-up-text-secondary text-xs mt-1">{n.mensaje}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(n.createdAt).toLocaleString('es-PE')}
                </p>
                {!n.leida && (
                  <form action={marcarLeidaAction.bind(null, n.id)} className="mt-1">
                    <button type="submit" className="text-xs text-up-blue">
                      Marcar leída
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
