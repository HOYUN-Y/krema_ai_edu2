export interface MailRow {
  ticketId: string
  receivedAt: string
  elapsedDays: number
  sender: string
  senderType: string
  language: string
  category: string
  department: string
  importance: number
  sentiment: string
  slaDue: string
  isDelayed: boolean
  status: string
  replied: string
  needsReview: boolean
  aiDraft: string
  gmailLink: string
  draftStatus: string
}

export interface SheetData {
  rows: MailRow[]
  fetchedAt: string
}
