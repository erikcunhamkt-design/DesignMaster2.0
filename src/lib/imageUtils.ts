import heic2any from 'heic2any';

const HEIC_EXTENSIONS = ['.heic', '.heif'];

function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (HEIC_EXTENSIONS.some(ext => name.endsWith(ext))) return true;
  if (file.type === 'image/heic' || file.type === 'image/heif') return true;
  return false;
}

/** Converts HEIC/HEIF files to JPEG blobs; returns other files as-is. */
export async function normalizeImageFile(file: File): Promise<Blob> {
  if (!isHeicFile(file)) return file;
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  return Array.isArray(result) ? result[0] : result;
}

/** Creates an object URL from a file, converting HEIC first if needed. */
export async function createNormalizedObjectUrl(file: File): Promise<string> {
  const blob = await normalizeImageFile(file);
  return URL.createObjectURL(blob);
}
