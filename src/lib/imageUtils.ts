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

/**
 * Compresses an image (from object URL or data URL) to max dimension and JPEG quality.
 * Returns a base64 data URL ready to send to the backend.
 */
export async function compressImageToBase64(
  src: string,
  maxDimension = 1024,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;

      // Scale down keeping aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = src;
  });
}
