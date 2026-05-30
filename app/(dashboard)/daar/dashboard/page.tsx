import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import {
  getPendientesCierre,
  getTodosReclamos,
} from '@/lib/services/reclamo.service';
import { getDashboardDaarData } from '@/lib/services/dashboard-daar.service';
import { DashboardClient } from '@/components/daar/dashboard-client';
import { CorreoPruebaPanel } from '@/components/daar/correo-prueba-panel';

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard DAAR</h1>
        <p className="text-gray-600 text-sm">
          Panel analítico en tiempo real — reemplaza el Excel de seguimiento de reclamos.
        </p>
      </div>

      <CorreoPruebaPanel />

      <DashboardClient initial={initial} pendientesCierre={pendientes} todos={todos} />
    </div>
  );
}
