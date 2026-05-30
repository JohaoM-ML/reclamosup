import { createHash } from 'crypto';
import { mkdir, writeFile, readFile } from 'fs/promises';
import path from 'path';
import {
  EXAMENES_BUCKET,
  getSupabaseAdmin,
  isSupabaseStorageConfigured,
} from '@/lib/supabase-admin';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function assertStorageListoParaProduccion() {
  if (process.env.VERCEL && !isSupabaseStorageConfigured()) {
    throw new Error(
      'Storage no configurado en Vercel. Agrega SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Environment Variables y redeploy.'
    );
  }
}

export function validarTamanoArchivo(size: number) {
  if (size <= 0) throw new Error('El archivo está vacío');
  if (size > MAX_FILE_BYTES) {
    throw new Error(`El archivo supera el límite de ${MAX_FILE_BYTES / (1024 * 1024)} MB`);
  }
}

function contentTypeFromExt(ext: string): string {
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return 'application/octet-stream';
}

function storageKeyFor(reclamoId: string, ext: string) {
  return `${reclamoId}/examen.${ext}`;
}

/** URL firmada para subida directa desde el navegador (evita límite 4.5 MB de Vercel). */
export async function crearUrlSubidaFirmada(
  reclamoId: string,
  fileName: string
): Promise<{ signedUrl: string; path: string; token: string }> {
  assertStorageListoParaProduccion();

  if (!isSupabaseStorageConfigured()) {
    throw new Error(
      'Supabase Storage no configurado. Ejecuta npm run storage:setup y configura las variables en Vercel.'
    );
  }

  const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const storageKey = storageKeyFor(reclamoId, ext);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(EXAMENES_BUCKET)
    .createSignedUploadUrl(storageKey, { upsert: true });

  if (error || !data) {
    throw new Error(
      error?.message ??
        'No se pudo preparar la subida. Verifica que el bucket examenes-reclamo exista (npm run storage:setup).'
    );
  }

  return {
    signedUrl: data.signedUrl,
    path: storageKey,
    token: data.token,
  };
}

/** Tras subida directa, calcula hash y confirma el archivo en Storage. */
export async function confirmarExamenSubido(storageKey: string): Promise<{ hash: string }> {
  const { buffer } = await leerExamenEscaneado(storageKey);
  const hash = createHash('sha256').update(buffer).digest('hex');
  return { hash };
}

export async function subirExamenEscaneado(
  reclamoId: string,
  file: File
): Promise<{ path: string; hash: string; filename: string }> {
  validarTamanoArchivo(file.size);
  assertStorageListoParaProduccion();

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = createHash('sha256').update(buffer).digest('hex');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const filename = `examen.${ext}`;
  const storageKey = storageKeyFor(reclamoId, ext);

  if (isSupabaseStorageConfigured()) {
    const supabase = getSupabaseAdmin();
    const contentType = file.type || contentTypeFromExt(ext);

    const { error } = await supabase.storage
      .from(EXAMENES_BUCKET)
      .upload(storageKey, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Error al subir a Supabase Storage: ${error.message}`);
    }
  } else {
    const dir = path.join(UPLOAD_DIR, reclamoId);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
  }

  return { path: storageKey, hash, filename };
}

export async function eliminarExamenEscaneado(storageKey: string) {
  if (isSupabaseStorageConfigured()) {
    const supabase = getSupabaseAdmin();
    await supabase.storage.from(EXAMENES_BUCKET).remove([storageKey]);
    return;
  }
  const absPath = path.join(UPLOAD_DIR, storageKey);
  try {
    const { unlink } = await import('fs/promises');
    await unlink(absPath);
  } catch {
    /* ignore */
  }
}

/** Descarga el archivo para servirlo (API / visor PDF) */
export async function leerExamenEscaneado(
  storageKey: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const ext = storageKey.split('.').pop()?.toLowerCase() ?? 'pdf';
  const contentType = contentTypeFromExt(ext);

  if (isSupabaseStorageConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(EXAMENES_BUCKET)
      .download(storageKey);

    if (error || !data) {
      throw new Error(error?.message ?? 'Archivo no encontrado en Storage');
    }

    const arrayBuffer = await data.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType };
  }

  const absPath = path.join(UPLOAD_DIR, storageKey);
  const buffer = await readFile(absPath);
  return { buffer, contentType };
}

/** @deprecated Solo fallback local */
export function getUploadAbsolutePath(relativePath: string): string {
  return path.join(UPLOAD_DIR, relativePath);
}
