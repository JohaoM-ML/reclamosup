import 'dotenv/config';
import { ensureExamenesBucket } from '../lib/supabase-admin';

ensureExamenesBucket()
  .then(() => console.log('Storage listo'))
  .catch((e) => {
    console.error('Error:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
