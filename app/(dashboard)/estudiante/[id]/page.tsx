import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getReclamoById } from '@/lib/services/reclamo.service';
import { ReclamoDetailLayout } from '@/components/reclamos/reclamo-detail-layout';

export default async function EstudianteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.rol !== 'estudiante') redirect('/login');

  const { id } = await params;
  const reclamo = await getReclamoById(id);

  if (reclamo.estudianteId !== session.id) redirect('/estudiante');

  return (
    <ReclamoDetailLayout
      reclamo={reclamo}
      id={id}
      backHref="/estudiante"
      backLabel="Mis reclamos"
      pdfTitle="Examen escaneado por DAAR"
      progress
    />
  );
}
