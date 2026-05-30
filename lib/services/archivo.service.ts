import { createHash } from 'crypto';
import { mkdir, writeFile, readFile } from 'fs/promises';
import path from 'path';
import {
  EXAMENES_BUCKET,
  getSupabaseAdmin,
  isSupabaseStorageConfigured,
} from '@/lib/supabase-admin';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function contentTypeFromExt(ext: string): string {
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return 'application/octet-stream';
}

export async function subirExamenEscaneado(
  reclamoId: string,
  file: File
): Promise<{ path: string; hash: string; filename: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = createHash('sha256').update(buffer).digest('hex');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const filename = `examen.${ext}`;
  const storageKey = `${reclamoId}/${filename}`;

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
