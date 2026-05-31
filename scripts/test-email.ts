import 'dotenv/config';
import { sendEmailToUser } from '../lib/services/email.service';

const destinos = [
  'jr.mendozaf@alum.up.edu.pe',
  'pa.tueroc@alum.up.edu.pe',
  'Ap.Carhuavilcac@alum.up.edu.pe',
];

async function main() {
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'set' : 'MISSING');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('NODE_ENV:', process.env.NODE_ENV ?? '(unset)');

  for (const to of destinos) {
    const r = await sendEmailToUser(to, 'Test ReclamoUP diagnóstico', `Prueba a ${to}`);
    console.log(to, r);
  }
}

main();
