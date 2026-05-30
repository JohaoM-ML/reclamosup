import type { EstadoReclamo } from '@/lib/types';
import { ESTADO_LABELS } from '@/lib/types';

const PASOS = [
  { label: 'Registrado', descripcion: 'Reclamo enviado desde CAP' },
  { label: 'Revisión docente', descripcion: 'El docente analiza su examen' },
  { label: 'Validación DAAR', descripcion: 'DAAR verifica y cierra el caso' },
  { label: 'Concluido', descripcion: 'Resultado publicado' },
] as const;

function indiceProgreso(estado: EstadoReclamo): number {
  switch (estado) {
    case 'PENDIENTE_ESCANEO':
      return 0;
    case 'ENVIADO':
    case 'EN_REVISION':
      return 1;
    case 'EN_VALIDACION':
      return 2;
    case 'CERRADO':
      return 3;
    default:
      return -1;
  }
}

export function ReclamoProgressTimeline({ estado }: { estado: EstadoReclamo }) {
  if (estado === 'RECHAZADO' || estado === 'ANULADO') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm font-medium text-red-800">
          {ESTADO_LABELS[estado]}
        </p>
        <p className="text-xs text-red-600 mt-1">
          Este reclamo no continuará el flujo habitual.
        </p>
      </div>
    );
  }

  const actual = indiceProgreso(estado);

  return (
    <div className="bg-white rounded-lg border p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">Progreso de su reclamo</h2>
      <ol className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0">
        {PASOS.map((paso, i) => {
          const completado = i < actual;
          const enCurso = i === actual;
          const pendiente = i > actual;

          return (
            <li key={paso.label} className="flex sm:flex-1 sm:flex-col sm:items-center sm:text-center relative">
              {i > 0 && (
                <span
                  className={`hidden sm:block absolute top-4 -left-1/2 w-full h-0.5 ${
                    completado ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  completado
                    ? 'bg-indigo-600 text-white'
                    : enCurso
                      ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {completado ? '✓' : i + 1}
              </span>
              <div className="ml-3 sm:ml-0 sm:mt-2 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    pendiente ? 'text-gray-400' : enCurso ? 'text-indigo-700' : 'text-gray-900'
                  }`}
                >
                  {paso.label}
                  {enCurso && (
                    <span className="ml-2 text-xs font-normal text-indigo-600">(actual)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 hidden sm:block">{paso.descripcion}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs text-gray-500 sm:hidden">
        Estado actual: <strong>{ESTADO_LABELS[estado]}</strong>
      </p>
    </div>
  );
}
