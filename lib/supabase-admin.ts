import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const EXAMENES_BUCKET = 'examenes-reclamo';

let adminClient: SupabaseClient | null = null;

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Cliente admin (solo servidor). Nunca exponer SERVICE_ROLE_KEY al navegador. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseStorageConfigured()) {
    throw new Error(
      'Supabase Storage no configurado. Agrega SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env'
    );
  }

  if (!adminClient) {
    adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }

  return adminClient;
}

/** Crea el bucket privado si no existe (ejecutar una vez con npm run storage:setup) */
export async function ensureExamenesBucket() {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) throw listError;

  const exists = buckets?.some((b) => b.name === EXAMENES_BUCKET);
  if (exists) {
    console.log(`Bucket "${EXAMENES_BUCKET}" ya existe`);
    return;
  }

  const { error } = await supabase.storage.createBucket(EXAMENES_BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
  });

  if (error) throw error;
  console.log(`Bucket "${EXAMENES_BUCKET}" creado (privado, máx 10 MB)`);
}
