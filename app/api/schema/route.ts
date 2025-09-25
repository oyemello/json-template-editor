import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'app', 'json input', 'schema.json')
    const text = await fs.readFile(filePath, 'utf-8')
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to read schema.json', detail: String(err) }, { status: 500 })
  }
}

