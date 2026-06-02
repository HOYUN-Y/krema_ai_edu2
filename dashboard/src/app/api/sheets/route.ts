import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchSheetData } from '@/lib/sheets'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await fetchSheetData()
  return NextResponse.json(data)
}
