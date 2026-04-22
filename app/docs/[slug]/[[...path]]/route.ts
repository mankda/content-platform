import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const MIME: Record<string, string> = {
  html:  'text/html; charset=utf-8',
  js:    'application/javascript',
  css:   'text/css',
  json:  'application/json',
  svg:   'image/svg+xml',
  png:   'image/png',
  jpg:   'image/jpeg',
  jpeg:  'image/jpeg',
  gif:   'image/gif',
  webp:  'image/webp',
  ico:   'image/x-icon',
  woff:  'font/woff',
  woff2: 'font/woff2',
  ttf:   'font/ttf',
  eot:   'application/vnd.ms-fontobject',
  map:   'application/json',
  txt:   'text/plain',
  xml:   'application/xml',
}

function mime(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return MIME[ext] ?? 'application/octet-stream'
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; path?: string[] }> }
) {
  const { slug, path } = await params

  let filePath = (path ?? []).join('/')
  if (!filePath || filePath.endsWith('/')) filePath += 'index.html'
  if (!filePath.includes('.')) filePath += '/index.html'

  try {
    const data = await readFile(join(process.cwd(), 'projects', slug, 'generated', filePath))
    return new NextResponse(data, {
      headers: { 'Content-Type': mime(filePath.split('/').pop() ?? filePath) },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
