import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getCursosEstudiante, getImpedidoEstudiante } from '@/lib/services/reclamo.service';
import { NuevoReclamoForm } from '@/components/estudiante/nuevo-reclamo-form';

export default async function NuevoReclamoPage() {
  const session = await getSession();
  if (!session || session.rol !== 'estudiante') redirect('/login');

  const [cursos, impedidoHasta] = await Promise.all([
    getCursosEstudiante(session.id),
    getImpedidoEstudiante(session.id),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nuevo reclamo — CAP</h1>
      <p className="text-gray-800 mb-6 text-sm">
        Con el representante de aula presente, escanee su examen y complete el formulario. El
        reclamo se envía directamente al docente.
      </p>
      {impedidoHasta && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Está impedido de presentar reclamos hasta el semestre <strong>{impedidoHasta}</strong>{' '}
          (3 reclamos no procedentes en el semestre anterior).
        </div>
      )}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <NuevoReclamoForm cursos={cursos} />
      </div>
    </div>
  );
}
