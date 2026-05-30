import { redirect } from 'next/navigation';
import { getSession, getDashboardPath } from '@/lib/auth';

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  redirect(getDashboardPath(session.rol));
}
