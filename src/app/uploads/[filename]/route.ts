import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getMimeForFile } from '@/lib/upload';

// Safe filename pattern: hex 32 chars + extension (.jpg, .png, .webp)
const SAFE_FILENAME_REGEX = /^[a-f0-9]{32}\.(jpg|jpeg|png|webp)$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } },
) {
  const filename = params.filename;

  // Prevent path traversal and enforce safe filenames
  if (!SAFE_FILENAME_REGEX.test(filename)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const filePath = join(uploadDir, filename);

  if (!existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    const contentType = getMimeForFile(filename);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
