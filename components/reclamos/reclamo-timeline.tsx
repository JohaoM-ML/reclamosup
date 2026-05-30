import { ESTADO_LABELS, MOTIVO_LABELS, RESULTADO_FINAL_LABELS, type MotivoReclamo, type ResultadoFinal } from '@/lib/types';

type Evento = {
  id: string;
  accion: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  createdAt: Date;
  actor: { nombre: string; rol: string };
  metadata: string | null;
};

export function ReclamoTimeline({ eventos }: { eventos: Evento[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Historial del reclamo</h3>
      <ol className="relative border-l border-gray-200 ml-3 space-y-6">
        {eventos.map((ev) => (
          <li key={ev.id} className="ml-6">
            <span className="absolute -left-1.5 flex h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white" />
            <time className="text-xs text-gray-500">
              {new Date(ev.createdAt).toLocaleString('es-PE')}
            </time>
            <p className="text-sm font-medium text-gray-900">{ev.accion.replace(/_/g, ' ')}</p>
            <p className="text-xs text-gray-600">
              {ev.actor.nombre} ({ev.actor.rol})
            </p>
            {ev.estadoNuevo && (
              <p className="text-xs text-gray-500">
                Estado: {ESTADO_LABELS[ev.estadoNuevo as keyof typeof ESTADO_LABELS] ?? ev.estadoNuevo}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ReclamoDetalleInfo({
  reclamo,
}: {
  reclamo: {
    motivo: string;
    argumento: string;
    preguntaMarcada: number | null;
    notaAnterior: number;
    notaNueva: number | null;
    decision: string | null;
    resultadoFinal?: string | null;
    comentarioDocente: string | null;
    archivoPath?: string | null;
    evaluacion: {
      nombre: string;
      tipo: string;
      curso: { codigo: string; nombre: string };
    };
    estudiante: { nombre: string; codigo: string | null };
    docente: { nombre: string };
  };
}) {
  return (
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-gray-500">Estudiante</dt>
        <dd className="font-medium">{reclamo.estudiante.nombre}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Código</dt>
        <dd className="font-medium">{reclamo.estudiante.codigo ?? '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Curso</dt>
        <dd className="font-medium">
          {reclamo.evaluacion.curso.codigo} — {reclamo.evaluacion.curso.nombre}
        </dd>
      </div>
      <div>
        <dt className="text-gray-500">Evaluación</dt>
        <dd className="font-medium">
          {reclamo.evaluacion.nombre} ({reclamo.evaluacion.tipo})
        </dd>
      </div>
      <div>
        <dt className="text-gray-500">Motivo</dt>
        <dd className="font-medium">
          {MOTIVO_LABELS[reclamo.motivo as MotivoReclamo] ?? reclamo.motivo}
        </dd>
      </div>
      <div>
        <dt className="text-gray-500">Pregunta marcada</dt>
        <dd className="font-medium">{reclamo.preguntaMarcada ?? '—'}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-gray-500">Argumento</dt>
        <dd className="font-medium">{reclamo.argumento}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Nota anterior</dt>
        <dd className="font-medium">{reclamo.notaAnterior}</dd>
      </div>
      {reclamo.notaNueva != null && (
        <div>
          <dt className="text-gray-500">Nota nueva</dt>
          <dd className="font-medium text-green-700">{reclamo.notaNueva}</dd>
        </div>
      )}
      {reclamo.resultadoFinal && (
        <div>
          <dt className="text-gray-500">Resultado final</dt>
          <dd className="font-medium">
            {RESULTADO_FINAL_LABELS[reclamo.resultadoFinal as ResultadoFinal] ??
              reclamo.resultadoFinal}
          </dd>
        </div>
      )}
      {reclamo.decision && !reclamo.resultadoFinal && (
        <div>
          <dt className="text-gray-500">Decisión docente</dt>
          <dd className="font-medium capitalize">{reclamo.decision.replace('_', ' ')}</dd>
        </div>
      )}
      {reclamo.archivoPath && (
        <div className="sm:col-span-2">
          <span className="inline-block text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
            Devolución virtual — examen disponible digitalmente
          </span>
        </div>
      )}
      {reclamo.comentarioDocente && (
        <div className="sm:col-span-2">
          <dt className="text-gray-500">Comentario docente</dt>
          <dd className="font-medium">{reclamo.comentarioDocente}</dd>
        </div>
      )}
      <div>
        <dt className="text-gray-500">Docente asignado</dt>
        <dd className="font-medium">{reclamo.docente.nombre}</dd>
      </div>
    </dl>
  );
}
