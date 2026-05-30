'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useActionState, useTransition } from 'react';
import {
  crearReclamoEstudianteAction,
  type ActionResult,
} from '@/app/actions/reclamo.actions';
import { inputClass, labelClass } from '@/lib/types';

type Curso = {
  codigo: string;
  nombre: string;
};

type Seccion = {
  cursoRowId: string;
  seccion: string;
  docente: { nombre: string; email: string };
};

type Evaluacion = {
  id: string;
  nombre: string;
  tipo: string;
  notaPublicada: number | null;
};

const initial: ActionResult = { ok: false };

function labelEvaluacion(tipo: string): string {
  const t = tipo.toLowerCase();
  if (t.includes('parcial')) return 'Parcial';
  if (t.includes('final')) return 'Final';
  return tipo;
}

export function NuevoReclamoForm({ cursos }: { cursos: Curso[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    crearReclamoEstudianteAction,
    initial
  );
  const [codigoCurso, setCodigoCurso] = useState('');
  const [seccion, setSeccion] = useState('');
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loadingSecciones, setLoadingSecciones] = useState(false);
  const [evaluacionId, setEvaluacionId] = useState('');
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loadingEv, setLoadingEv] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [, startTransition] = useTransition();

  const seccionSeleccionada = secciones.find((s) => s.seccion === seccion);

  useEffect(() => {
    if (state.ok && state.id) {
      router.push(`/estudiante/${state.id}`);
    }
  }, [state.ok, state.id, router]);

  useEffect(() => {
    if (!codigoCurso) {
      setSecciones([]);
      setSeccion('');
      return;
    }
    setLoadingSecciones(true);
    setSeccion('');
    fetch(`/api/secciones?cursoId=${encodeURIComponent(codigoCurso)}`)
      .then((r) => r.json())
      .then((data: Seccion[]) => {
        setSecciones(data);
        if (data.length === 1) {
          setSeccion(data[0].seccion);
        }
      })
      .finally(() => setLoadingSecciones(false));
  }, [codigoCurso]);

  useEffect(() => {
    if (!codigoCurso || !seccion) {
      setEvaluaciones([]);
      setEvaluacionId('');
      return;
    }
    setLoadingEv(true);
    setEvaluacionId('');
    const params = new URLSearchParams({ cursoId: codigoCurso, seccion });
    fetch(`/api/evaluaciones?${params}`)
      .then((r) => r.json())
      .then((data: Evaluacion[]) => {
        setEvaluaciones(data);
        if (data.length === 1) {
          setEvaluacionId(data[0].id);
        }
      })
      .finally(() => setLoadingEv(false));
  }, [codigoCurso, seccion]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowModal(true);
  }

  function handleConfirm() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    setShowModal(false);
    startTransition(() => {
      action(formData);
    });
  }

  const evaluacionUnica = evaluaciones.length === 1 ? evaluaciones[0] : null;

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <div className="rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-gray-900">
          <strong>Paso 1 — Representante de aula:</strong> debe estar presente y observar el
          escaneo íntegro del examen.
          <br />
          <strong>Paso 2 — Usted (estudiante):</strong> complete el formulario y adjunte el PDF
          del examen escaneado. El reclamo se envía directamente al docente.
        </div>

        <div>
          <label className={labelClass}>Curso</label>
          <select
            name="cursoId"
            required
            value={codigoCurso}
            onChange={(e) => setCodigoCurso(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar curso...</option>
            {cursos.map((c) => (
              <option key={c.codigo} value={c.codigo}>
                {c.nombre} — {c.codigo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Sección</label>
          <select
            required
            value={seccion}
            onChange={(e) => setSeccion(e.target.value)}
            disabled={!codigoCurso || loadingSecciones || secciones.length === 0}
            className={`${inputClass} disabled:bg-gray-100`}
          >
            <option value="">
              {loadingSecciones
                ? 'Cargando secciones...'
                : secciones.length === 0
                  ? 'Sin secciones matriculadas'
                  : 'Seleccionar sección...'}
            </option>
            {secciones.map((s) => (
              <option key={s.cursoRowId} value={s.seccion}>
                Sección {s.seccion} — Prof. {s.docente.nombre}
              </option>
            ))}
          </select>
          {seccionSeleccionada && (
            <p className="text-xs text-gray-600 mt-1">
              Docente: {seccionSeleccionada.docente.nombre} (
              {seccionSeleccionada.docente.email})
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Evaluación</label>
          <select
            name="evaluacionId"
            required
            value={evaluacionId}
            onChange={(e) => setEvaluacionId(e.target.value)}
            disabled={!seccion || loadingEv || evaluaciones.length === 0}
            className={`${inputClass} disabled:bg-gray-100`}
          >
            <option value="">
              {loadingEv
                ? 'Cargando...'
                : evaluaciones.length === 0
                  ? 'Sin evaluaciones disponibles'
                  : 'Seleccionar evaluación...'}
            </option>
            {evaluacionUnica && (
              <option value={evaluacionUnica.id}>
                {labelEvaluacion(evaluacionUnica.tipo)}
                {evaluacionUnica.notaPublicada != null &&
                  ` — Nota: ${evaluacionUnica.notaPublicada}`}
              </option>
            )}
          </select>
        </div>

        <div>
          <label className={labelClass}>Motivo del reclamo</label>
          <select name="motivo" required className={inputClass}>
            <option value="error_suma">Error de suma</option>
            <option value="revision_integral">Revisión integral (la nota puede bajar)</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Pregunta marcada (opcional)</label>
          <input name="preguntaMarcada" type="number" min="1" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Argumento / fundamento</label>
          <textarea
            name="argumento"
            required
            rows={4}
            className={inputClass}
            placeholder="Explique por qué solicita la reconsideración..."
          />
        </div>

        <div>
          <label className={labelClass}>Examen escaneado (PDF o imagen)</label>
          <input
            name="archivo"
            type="file"
            required
            accept=".pdf,image/*"
            disabled={!evaluacionId}
            className="w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Escanee el examen completo con el representante de aula presente.
          </p>
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-900">
          <input type="checkbox" name="examenNoLapiz" value="true" required className="mt-1" />
          <span>
            Declaro que mi examen <strong>no</strong> fue hecho con lápiz u otro medio borrable
            (Art. 38)
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-gray-900">
          <input
            type="checkbox"
            name="representantePresenciado"
            value="true"
            required
            className="mt-1"
          />
          <span>
            Confirmo que el <strong>representante de aula</strong> presenció el escaneo íntegro de
            mi examen.
          </span>
        </label>

        {state.error && (
          <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-200">
            {state.error}
          </p>
        )}

        {pending && (
          <div className="rounded-md border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 flex items-center gap-3">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Subiendo examen y registrando reclamo...
          </div>
        )}

        <button
          type="submit"
          disabled={pending || !evaluacionId}
          className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? 'Enviando...' : 'Enviar reclamo al docente'}
        </button>
      </form>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Confirmar envío</h3>
            <ul className="space-y-3 text-sm text-gray-800 list-disc pl-5">
              <li>
                Recuerda: si tu examen fue hecho con lápiz, el reclamo no procede (Art. 38).
              </li>
              <li>
                Recuerda: no puedes tener más de 3 reclamos con resultado No Procedente en el
                semestre.
              </li>
            </ul>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Confirmar y enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
