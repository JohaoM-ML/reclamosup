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
      <h3 className="text-sm font-semibold text-up-text-secondary">Historial del reclamo</h3>
      <ol className="relative border-l border-up-border ml-3 space-y-6">
        {eventos.map((ev) => (
          <li key={ev.id} className="ml-6">
            <span className="absolute -left-1.5 flex h-3 w-3 rounded-full bg-up-blue/50 ring-4 ring-white" />
            <time className="text-xs text-up-text-muted">
              {new Date(ev.createdAt).toLocaleString('es-PE')}
            </time>
            <p className="text-sm font-medium text-up-text">{ev.accion.replace(/_/g, ' ')}</p>
            <p className="text-xs text-up-text-secondary">
              {ev.actor.nombre} ({ev.actor.rol})
            </p>
            {ev.estadoNuevo && (
              <p className="text-xs text-up-text-muted">
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
        <dt className="text-up-text-muted">Estudiante</dt>
        <dd className="font-medium">{reclamo.estudiante.nombre}</dd>
      </div>
      <div>
        <dt className="text-up-text-muted">Código</dt>
        <dd className="font-medium">{reclamo.estudiante.codigo ?? '—'}</dd>
      </div>
      <div>
        <dt className="text-up-text-muted">Curso</dt>
        <dd className="font-medium">
          {reclamo.evaluacion.curso.codigo} — {reclamo.evaluacion.curso.nombre}
        </dd>
      </div>
      <div>
        <dt className="text-up-text-muted">Evaluación</dt>
        <dd className="font-medium">
          {reclamo.evaluacion.nombre} ({reclamo.evaluacion.tipo})
        </dd>
      </div>
      <div>
        <dt className="text-up-text-muted">Motivo</dt>
        <dd className="font-medium">
          {MOTIVO_LABELS[reclamo.motivo as MotivoReclamo] ?? reclamo.motivo}
        </dd>
      </div>
      <div>
        <dt className="text-up-text-muted">Pregunta marcada</dt>
        <dd className="font-medium">{reclamo.preguntaMarcada ?? '—'}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-up-text-muted">Argumento</dt>
        <dd className="font-medium">{reclamo.argumento}</dd>
      </div>
      <div>
        <dt className="text-up-text-muted">Nota anterior</dt>
        <dd className="font-medium">{reclamo.notaAnterior}</dd>
      </div>
      {reclamo.notaNueva != null && (
        <div>
          <dt className="text-up-text-muted">Nota nueva</dt>
          <dd className="font-medium text-green-700">{reclamo.notaNueva}</dd>
        </div>
      )}
      {reclamo.resultadoFinal && (
        <div>
          <dt className="text-up-text-muted">Resultado final</dt>
          <dd className="font-medium">
            {RESULTADO_FINAL_LABELS[reclamo.resultadoFinal as ResultadoFinal] ??
              reclamo.resultadoFinal}
          </dd>
        </div>
      )}
      {reclamo.decision && !reclamo.resultadoFinal && (
        <div>
          <dt className="text-up-text-muted">Decisión docente</dt>
          <dd className="font-medium capitalize">{reclamo.decision.replace('_', ' ')}</dd>
        </div>
      )}
      {reclamo.archivoPath && (
        <div className="sm:col-span-2">
          <span className="inline-block text-xs font-medium bg-up-blue/10 text-up-navy px-2 py-0.5 rounded">
            Devolución virtual — examen disponible digitalmente
          </span>
        </div>
      )}
      {reclamo.comentarioDocente && (
        <div className="sm:col-span-2">
          <dt className="text-up-text-muted">Comentario docente</dt>
          <dd className="font-medium">{reclamo.comentarioDocente}</dd>
        </div>
      )}
      <div>
        <dt className="text-up-text-muted">Docente asignado</dt>
        <dd className="font-medium">{reclamo.docente.nombre}</dd>
      </div>
    </dl>
  );
}
