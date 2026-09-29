import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { findImageByHash, saveImageRecord } from '@/lib/timeline-service';

// Magic bytes validator for real image format detection
function detectImageMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return 'image/png';
  }

  // GIF: starts with GIF87a or GIF89a (47 49 46 38 37 61 or 47 49 46 38 39 61)
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return 'image/gif';
  }

  // WebP: starts with 'RIFF' at 0..3 and 'WEBP' at 8..11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // SVG: starts with XML tag or <svg (ignoring leading whitespace and BOM)
  const previewSlice = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf8').trimStart();
  if (previewSlice.startsWith('<?xml') || previewSlice.startsWith('<svg')) {
    if (previewSlice.includes('<svg') || previewSlice.includes('http://www.w3.org/2000/svg')) {
      return 'image/svg+xml';
    }
  }

  // BMP: starts with BM (42 4D)
  if (buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4D) {
    return 'image/bmp';
  }

  return null;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const requestedFilename = searchParams.get('filename') || 'upload.png';

    let buffer: Buffer | null = null;
    let originalFilename: string = requestedFilename;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      originalFilename = file.name || requestedFilename;
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      if (!request.body) {
        return NextResponse.json({ error: 'No body provided' }, { status: 400 });
      }
      const blob = await request.blob();
      const arrayBuffer = await blob.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    }

    // Maximum size: 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image file size exceeds the 5MB maximum limit' },
        { status: 400 }
      );
    }

    // 1. Validate real image content by inspecting magic bytes
    const realMimeType = detectImageMimeType(buffer);
    if (!realMimeType) {
      return NextResponse.json(
        { error: 'Invalid file format: content is not a supported image (PNG, JPEG, WebP, GIF, SVG, BMP)' },
        { status: 400 }
      );
    }

    // 2. Compute cryptographic SHA-256 hash of the image content
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // 3. Deduplication check: check if an identical image content already exists
    const existing = await findImageByHash(sha256);
    if (existing) {
      // Re-use existing image URL and return image ID and details
      return NextResponse.json({
        id: existing.id,
        url: existing.url,
        hash: existing.hash,
        mimeType: existing.mimeType,
        sizeBytes: existing.sizeBytes,
        reused: true,
        message: 'Identical image found in storage; reused existing record.'
      });
    }

    // Check credentials for Vercel Blob
    const hasBlobCredentials = Boolean(
      process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN) ||
      process.env.BLOB_STORE_ID
    );

    let finalUrl: string;

    if (hasBlobCredentials) {
      // Use clean filename based on hash to avoid collisions on storage
      const ext = realMimeType.split('/')[1]?.replace('+xml', '') || 'png';
      const storageFilename = `${sha256.substring(0, 16)}.${ext}`;

      const blob = await put(storageFilename, buffer, {
        access: 'public',
        contentType: realMimeType,
        addRandomSuffix: false
      });
      finalUrl = blob.url;
    } else {
      // Graceful local dev fallback when Vercel credentials are not set
      finalUrl = `data:${realMimeType};base64,${buffer.toString('base64')}`;
    }

    // 4. Save new image record into database
    const savedRecord = await saveImageRecord({
      hash: sha256,
      url: finalUrl,
      mimeType: realMimeType,
      sizeBytes: buffer.length,
      originalFilename
    });

    return NextResponse.json({
      id: savedRecord.id,
      url: savedRecord.url,
      hash: savedRecord.hash,
      mimeType: savedRecord.mimeType,
      sizeBytes: savedRecord.sizeBytes,
      reused: false
    });
  } catch (error) {
    console.error('Error uploading/processing image:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
