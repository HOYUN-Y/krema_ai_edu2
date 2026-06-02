import { execSync } from 'child_process'
import type { MailRow, SheetData } from './types'

function parseRows(values: string[][]): MailRow[] {
  const [headerRow, ...dataRows] = values
  const colIndex: Record<string, number> = {}
  ;(headerRow as string[]).forEach((h: string, i: number) => { colIndex[h] = i })

  function get(row: string[], header: string): string {
    const i = colIndex[header]
    return i !== undefined ? (row[i] ?? '') : ''
  }

  return dataRows
    .filter(row => row.some(cell => cell))
    .map(row => ({
      ticketId: get(row, '티켓ID'),
      receivedAt: get(row, '최근수신(KST)'),
      elapsedDays: parseFloat(get(row, '경과(일)')) || 0,
      sender: get(row, '발신자'),
      senderType: get(row, '발신자유형'),
      language: get(row, '언어'),
      category: get(row, '분류'),
      department: get(row, '담당부서'),
      importance: parseFloat(get(row, '중요도')) || 0,
      sentiment: get(row, '감정'),
      slaDue: get(row, 'SLA기한'),
      isDelayed: get(row, '지연') === '지연',
      status: get(row, '처리상태'),
      replied: get(row, '회신여부'),
      needsReview: get(row, '검토필요') === '검토필요',
      aiDraft: get(row, 'AI회신초안/조치'),
      gmailLink: get(row, 'Gmail링크'),
      draftStatus: get(row, 'Draft상태'),
    }))
}

async function fetchViaServiceAccount(): Promise<string[][]> {
  const { google } = await import('googleapis')
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!
  const creds = JSON.parse(raw)
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!
  const tab = process.env.GOOGLE_SHEET_TAB!
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'!A1:Z300`,
  })
  return (res.data.values as string[][]) || []
}

function fetchViaGws(): string[][] {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!
  const tab = process.env.GOOGLE_SHEET_TAB || 'dummy mail data'
  const gwsPath = '/Users/lyuhoyun/Documents/GitHub/krema_ai_edu2/node_modules/.bin/gws'
  // Use tab name without single-quotes inside params JSON; spaces in tab name are fine without quoting
  const params = JSON.stringify({ spreadsheetId, range: `${tab}!A1:Z300` })
  const cmd = `${gwsPath} sheets spreadsheets values get --params '${params}' 2>/dev/null`
  const out = execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString()
  return (JSON.parse(out).values as string[][]) || []
}

export async function fetchSheetData(): Promise<SheetData> {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ''
  const isPlaceholder = !saJson || saJson === '여기에_JSON_한_줄로'

  const values = isPlaceholder
    ? fetchViaGws()
    : await fetchViaServiceAccount()

  return { rows: parseRows(values), fetchedAt: new Date().toISOString() }
}
