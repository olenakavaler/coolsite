import { randomBytes } from 'crypto';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Detect actual MIME type from file magic bytes.
 * Never trust MIME type or file extension from the client.
 */
function detectMimeFromBytes(buffer: Buffer): string | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null; // Unknown / disallowed (e.g. SVG)
}

function getUploadDir(): string {
  return process.env.UPLOAD_DIR || './uploads';
}

/**
 * Save uploaded file after validating magic bytes and size.
 * Returns the generated filename (never uses the original name).
 */
export async function saveUpload(file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error('Файл занадто великий (максимум 5 МБ)');
  }

  if (file.size === 0) {
    throw new Error('Файл порожній');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = detectMimeFromBytes(buffer);

  if (!mime) {
    throw new Error(
      'Невірний формат файлу. Дозволені: JPEG, PNG, WebP',
    );
  }

  const ext = EXTENSIONS[mime];
  // Random filename — ignores original name to prevent path traversal
  const filename = randomBytes(16).toString('hex') + ext;

  const uploadDir = getUploadDir();
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return filename;
}

/**
 * Delete an uploaded file (best-effort, does not throw on missing file).
 */
export async function deleteUpload(filename: string): Promise<void> {
  if (!filename) return;
  const uploadDir = getUploadDir();
  const filepath = join(uploadDir, filename);
  try {
    await unlink(filepath);
  } catch {
    // File already deleted or doesn't exist — that's fine
  }
}

export function getMimeForFile(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.'));
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  return mimeMap[ext] || 'application/octet-stream';
}
