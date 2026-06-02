import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { fetchSheetData } from '@/lib/sheets'
import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const data = await fetchSheetData()
  return <Dashboard data={data} />
}
