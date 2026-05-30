import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import {
  getPendientesCierre,
  getTodosReclamos,
} from '@/lib/services/reclamo.service';
import { getDashboardDaarData } from '@/lib/services/dashboard-daar.service';
import { DashboardClient } from '@/components/daar/dashboard-client';
import { CorreoPruebaPanel } from '@/components/daar/correo-prueba-panel';
import { PageHeader } from '@/components/ui/page-header';

export default async function DaarDashboardPage() {
  const session = await getSession();
  if (!session || session.rol !== 'daar') redirect('/login');

  const [initial, pendientes, todos] = await Promise.all([
    getDashboardDaarData('2026-I'),
    getPendientesCierre(),
    getTodosReclamos(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard DAAR"
        description="Panel analítico en tiempo real — seguimiento de reclamos de evaluaciones Pregrado."
      />

      <CorreoPruebaPanel />

      <DashboardClient initial={initial} pendientesCierre={pendientes} todos={todos} />
    </div>
  );
}
