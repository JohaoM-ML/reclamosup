'use server';

import { redirect } from 'next/navigation';
import {
  createSession,
  destroySession,
  getDashboardPath,
  loginUser,
} from '@/lib/auth';
import { loginSchema } from '@/lib/validators/reclamo.schema';

export type ActionResult = {
  ok: boolean;
  error?: string;
};

export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, error: 'Credenciales inválidas' };
  }

  const user = await loginUser(parsed.data.email, parsed.data.password);
  if (!user) {
    return { ok: false, error: 'Email o contraseña incorrectos' };
  }

  await createSession(user);
  redirect(getDashboardPath(user.rol));
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}
