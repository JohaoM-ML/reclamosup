'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  cancelarReclamoArchivoAction,
  finalizarReclamoArchivoAction,
  prepararReclamoArchivoAction,
  type ActionResult,
} from '@/app/actions/reclamo.actions';
import { Button } from '@/components/ui/button';
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

const MAX_MB = 10;

function labelEvaluacion(tipo: string): string {
  const t = tipo.toLowerCase();
  if (t.includes('parcial')) return 'Parcial';
  if (t.includes('final')) return 'Final';
  return tipo;
}

const MAX_PREGUNTAS = 20;

function PreguntasMarcadasPicker() {
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);

  function toggle(n: number) {
    setSeleccionadas((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)
    );
  }

  const resumen =
    seleccionadas.length === 0
      ? 'Ninguna seleccionada'
      : `Preguntas: ${seleccionadas.map((n) => `P${n}`).join(', ')}`;

  return (
    <details className="rounded-lg border border-up-border bg-up-surface">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-up-text select-none">
        Preguntas a reclamar (opcional) — {resumen}
      </summary>
      <div className="border-t border-up-border px-4 py-3">
        <p className="mb-3 text-xs text-up-text-muted">
          Marque las preguntas del examen que desea reclamar.
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {Array.from({ length: MAX_PREGUNTAS }, (_, i) => i + 1).map((n) => (
            <label
              key={n}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${
                seleccionadas.includes(n)
                  ? 'border-up-blue bg-up-blue/10 text-up-blue'
                  : 'border-up-border text-up-text'
              }`}
            >
              <input
                type="checkbox"
                name="preguntasMarcadas"
                value={n}
                checked={seleccionadas.includes(n)}
                onChange={() => toggle(n)}
                className="sr-only"
              />
              P{n}
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}

export function NuevoReclamoForm({ cursos }: { cursos: Curso[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [codigoCurso, setCodigoCurso] = useState('');
  const [seccion, setSeccion] = useState('');
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loadingSecciones, setLoadingSecciones] = useState(false);
  const [evaluacionId, setEvaluacionId] = useState('');
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loadingEv, setLoadingEv] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const seccionSeleccionada = secciones.find((s) => s.seccion === seccion);

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
        if (data.length === 1) setSeccion(data[0].seccion);
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
        if (data.length === 1) setEvaluacionId(data[0].id);
      })
      .finally(() => setLoadingEv(false));
  }, [codigoCurso, seccion]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setShowModal(true);
  }

  async function handleConfirm() {
    if (!formRef.current || !fileRef.current?.files?.[0]) return;

    const file = fileRef.current.files[0];
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo no puede superar ${MAX_MB} MB`);
      setShowModal(false);
      return;
    }

    setShowModal(false);
    setPending(true);
    setError(null);

    const formData = new FormData(formRef.current);
    formData.delete('archivo');
    formData.set('fileName', file.name);
    formData.set('fileSize', String(file.size));

    let reclamoId: string | undefined;
    let storageKey: string | undefined;

    try {
      setUploadStep('Validando datos...');
      const prep: ActionResult & { signedUrl?: string; path?: string } =
        await prepararReclamoArchivoAction({ ok: false }, formData);

      if (!prep.ok || !prep.signedUrl || !prep.path || !prep.id) {
        throw new Error(prep.error ?? 'No se pudo preparar la subida');
      }

      reclamoId = prep.id;
      storageKey = prep.path;

      setUploadStep('Subiendo examen...');
      const uploadRes = await fetch(prep.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/pdf',
        },
      });

      if (!uploadRes.ok) {
        const detail = await uploadRes.text().catch(() => '');
        throw new Error(
          detail
            ? `Error al subir archivo (${uploadRes.status}): ${detail.slice(0, 120)}`
            : `Error al subir archivo (${uploadRes.status}). Verifica Supabase Storage en Vercel.`
        );
      }

      setUploadStep('Registrando reclamo...');
      const done = await finalizarReclamoArchivoAction({
        reclamoId: prep.id,
        storageKey: prep.path,
      });

      if (!done.ok || !done.id) {
        throw new Error(done.error ?? 'Error al finalizar reclamo');
      }

      router.push(`/estudiante/${done.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al enviar reclamo';
      setError(msg);
      if (reclamoId) {
        await cancelarReclamoArchivoAction({ reclamoId, storageKey });
      }
    } finally {
      setPending(false);
      setUploadStep('');
    }
  }

  const evaluacionUnica = evaluaciones.length === 1 ? evaluaciones[0] : null;

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div className="rounded-md border border-up-blue/20 bg-up-blue/5 p-4 text-sm text-up-text">
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
            <p className="mt-1 text-xs text-up-text-secondary">
              Docente: {seccionSeleccionada.docente.nombre} ({seccionSeleccionada.docente.email})
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
          <PreguntasMarcadasPicker />
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
          <label className={labelClass}>Examen escaneado (PDF o imagen, máx. {MAX_MB} MB)</label>
          <input
            ref={fileRef}
            name="archivo"
            type="file"
            required
            accept=".pdf,image/*"
            disabled={!evaluacionId || pending}
            className="w-full text-sm text-up-text file:mr-4 file:rounded-md file:border-0 file:bg-up-blue/10 file:px-4 file:py-2 file:text-up-blue disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-up-text-muted">
            Escanee el examen completo con el representante de aula presente.
          </p>
        </div>

        <label className="flex items-start gap-2 text-sm text-up-text">
          <input type="checkbox" name="examenNoLapiz" value="true" required className="mt-1" />
          <span>
            Declaro que mi examen <strong>no</strong> fue hecho con lápiz u otro medio borrable
            (Art. 38)
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-up-text">
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

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {pending && (
          <div className="flex items-center gap-3 rounded-md border border-up-blue/20 bg-up-blue/5 p-4 text-sm text-up-navy">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-up-blue border-t-transparent" />
            {uploadStep || 'Procesando...'}
          </div>
        )}

        <Button type="submit" disabled={pending || !evaluacionId}>
          {pending ? 'Enviando...' : 'Enviar reclamo al docente'}
        </Button>
      </form>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg bg-up-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-up-text">Confirmar envío</h3>
            <ul className="list-disc space-y-3 pl-5 text-sm text-up-text-secondary">
              <li>
                Recuerda: si tu examen fue hecho con lápiz, el reclamo no procede (Art. 38).
              </li>
              <li>
                Recuerda: no puedes tener más de 3 reclamos con resultado No Procedente en el
                semestre.
              </li>
            </ul>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={pending}>
                Confirmar y enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
