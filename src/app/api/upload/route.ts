import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'upload.png';

    // Check if Vercel Blob credentials exist: either traditional BLOB_READ_WRITE_TOKEN
    // or modern OIDC credentials with BLOB_STORE_ID
    const hasBlobCredentials = Boolean(
      process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN) ||
      process.env.BLOB_STORE_ID
    );

    if (!hasBlobCredentials) {
      // In local dev without Vercel Blob credentials, handle graceful fallback by converting to data URL
      const formData = await request.formData().catch(() => null);
      if (formData) {
        const file = formData.get('file') as File | null;
        if (file) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const dataUrl = `data:${file.type || 'image/png'};base64,${buffer.toString('base64')}`;
          return NextResponse.json({ url: dataUrl });
        }
      }

      // If request has raw body (stream/arrayBuffer)
      const blob = await request.blob();
      const bytes = await blob.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mime = blob.type || 'image/png';
      const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
      return NextResponse.json({ url: dataUrl });
    }

    // When BLOB_READ_WRITE_TOKEN is present, upload to Vercel Blob
    // Check if multipart form data was sent
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      const blob = await put(file.name, file, { access: 'public' });
      return NextResponse.json(blob);
    }

    // Direct body stream upload
    if (!request.body) {
      return NextResponse.json({ error: 'No body provided' }, { status: 400 });
    }

    const blob = await put(filename, request.body, { access: 'public' });
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading file to Vercel Blob:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
