'use client'

import { useMemo } from 'react'
import type { MailRow } from '@/lib/types'

interface Props { rows: MailRow[] }

const TODAY = new Date('2026-06-02')

function parseSenderName(sender: string): string {
  const m = sender.match(/^(.+?)\s*</)
  return m ? m[1].trim() : sender.split('@')[0]
}

interface ScheduleItem {
  date: Date | null
  label: string
  context: string
  row: MailRow
  daysUntil: number | null
  isOverdue: boolean
  isSoonWarning: boolean
}

function parseDaysUntil(dateStr: string): { date: Date | null; daysUntil: number | null } {
  if (!dateStr) return { date: null, daysUntil: null }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { date: null, daysUntil: null }
  const diff = Math.floor((d.getTime() - TODAY.getTime()) / 86400000)
  return { date: d, daysUntil: diff }
}

function extractMeetingContext(text: string): string {
  const idx = text.indexOf('미팅')
  if (idx === -1) return ''
  const start = Math.max(0, idx - 20)
  const end = Math.min(text.length, idx + 40)
  return text.slice(start, end).trim()
}

function extractDateMentions(text: string, row: MailRow): ScheduleItem[] {
  const items: ScheduleItem[] = []

  // YYYY-MM-DD pattern
  const dateRegex = /(\d{4}-\d{2}-\d{2})/g
  let m
  while ((m = dateRegex.exec(text)) !== null) {
    const d = new Date(m[1])
    if (!isNaN(d.getTime())) {
      const daysUntil = Math.floor((d.getTime() - TODAY.getTime()) / 86400000)
      const ctxStart = Math.max(0, m.index - 30)
      const ctxEnd = Math.min(text.length, m.index + 60)
      items.push({
        date: d,
        label: '📅 날짜 언급',
        context: text.slice(ctxStart, ctxEnd).trim(),
        row,
        daysUntil,
        isOverdue: daysUntil < 0,
        isSoonWarning: daysUntil >= 0 && daysUntil <= 3,
      })
    }
  }

  // 미팅 mentions
  if (text.includes('미팅')) {
    const ctx = extractMeetingContext(text)
    items.push({
      date: null,
      label: '📅 미팅',
      context: ctx,
      row,
      daysUntil: null,
      isOverdue: false,
      isSoonWarning: false,
    })
  }

  return items
}

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
  boxShadow: 'inset 0 1px 0 var(--border), 0 0 0 1px var(--border)',
  borderRadius: '12px',
  padding: '20px 24px',
}

const pillStyle = (color: string): React.CSSProperties => ({
  borderRadius: '999px',
  padding: '2px 10px',
  fontSize: '11px',
  background: `color-mix(in oklch, ${color} 15%, transparent)`,
  border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
  color: color,
  fontWeight: 500,
})

export default function ScheduleSection({ rows }: Props) {
  const items = useMemo<ScheduleItem[]>(() => {
    const all: ScheduleItem[] = []

    rows.forEach((r) => {
      // SLA due date
      const { date, daysUntil } = parseDaysUntil(r.slaDue)
      if (date) {
        all.push({
          date,
          label: 'SLA 기한',
          context: `${parseSenderName(r.sender)} - ${r.category}`,
          row: r,
          daysUntil,
          isOverdue: (daysUntil ?? 0) < 0 || r.isDelayed,
          isSoonWarning: (daysUntil ?? 99) >= 0 && (daysUntil ?? 99) <= 3,
        })
      }

      // Extract from aiDraft
      if (r.aiDraft) {
        const extracted = extractDateMentions(r.aiDraft, r)
        all.push(...extracted)
      }
    })

    // Sort: overdue first, then by date asc, nulls last
    return all.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      if (a.date && b.date) return a.date.getTime() - b.date.getTime()
      if (a.date) return -1
      if (b.date) return 1
      return 0
    })
  }, [rows])

  if (items.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
        <p style={{ fontSize: '14px', color: 'var(--text-mute)' }}>추출된 일정이 없습니다.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        총 {items.length}건의 일정
      </div>
      {items.map((item, idx) => {
        const accentColor = item.isOverdue
          ? 'var(--accent-2)'
          : item.isSoonWarning
          ? 'var(--accent-4)'
          : 'var(--accent)'

        return (
          <div key={idx} style={{
            ...cardStyle,
            display: 'flex', gap: '16px', alignItems: 'flex-start',
            borderLeft: `3px solid ${accentColor}`,
          }}>
            {/* Date badge */}
            {item.date ? (
              <div style={{
                flexShrink: 0, textAlign: 'center',
                background: `color-mix(in oklch, ${accentColor} 12%, var(--surface))`,
                borderRadius: '8px', padding: '8px 12px', minWidth: '52px',
              }}>
                <div style={{ fontSize: '10px', color: accentColor, fontWeight: 600, textTransform: 'uppercase' }}>
                  {item.date.toLocaleDateString('ko-KR', { month: 'short' })}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: accentColor, lineHeight: 1.1 }}>
                  {item.date.getDate()}
                </div>
              </div>
            ) : (
              <div style={{
                flexShrink: 0, textAlign: 'center',
                background: 'var(--surface-2)',
                borderRadius: '8px', padding: '8px 12px', minWidth: '52px',
              }}>
                <div style={{ fontSize: '22px' }}>📅</div>
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: accentColor }}>{item.label}</span>
                <span style={pillStyle('var(--accent-3)')}>{item.row.category}</span>
                {item.daysUntil !== null && (
                  <span style={pillStyle(accentColor)}>
                    {item.daysUntil < 0 ? `${Math.abs(item.daysUntil)}일 초과` : item.daysUntil === 0 ? '오늘' : `D-${item.daysUntil}`}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>{item.context}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-mute)' }}>{parseSenderName(item.row.sender)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
