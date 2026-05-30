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
      <summary className="cursor-pointer list-none flex items-center gap-1 text-sm text-gray-600">
        🔔
        {count > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-[1.25rem] text-center">
            {count}
          </span>
        )}
      </summary>
      <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
        {notificaciones.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Sin notificaciones</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notificaciones.map((n) => (
              <li
                key={n.id}
                className={`p-3 text-sm ${n.leida ? 'bg-white' : 'bg-indigo-50'}`}
              >
                <p className="font-medium text-gray-900">{n.titulo}</p>
                <p className="text-gray-600 text-xs mt-1">{n.mensaje}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(n.createdAt).toLocaleString('es-PE')}
                </p>
                {!n.leida && (
                  <form action={marcarLeidaAction.bind(null, n.id)} className="mt-1">
                    <button type="submit" className="text-xs text-indigo-600">
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
