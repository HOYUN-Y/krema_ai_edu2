'use client'

import { useMemo } from 'react'
import type { MailRow } from '@/lib/types'

interface Props { rows: MailRow[] }

function parseSenderName(sender: string): string {
  const m = sender.match(/^(.+?)\s*</)
  return m ? m[1].trim() : sender.split('@')[0]
}

const RECRUIT_KEYWORDS = ['채용', '지원', '이력서', '면접', '합격', '불합격']

const KANBAN_COLS: { id: string; label: string; keywords: string[] }[] = [
  { id: '지원접수', label: '지원접수', keywords: ['지원', '이력서'] },
  { id: '서류검토', label: '서류검토', keywords: ['서류', '검토'] },
  { id: '면접예정', label: '면접예정', keywords: ['면접'] },
  { id: '최종결과', label: '최종결과', keywords: ['합격', '불합격'] },
]

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

export default function RecruitmentSection({ rows }: Props) {
  const matched = useMemo(() =>
    rows.filter((r) => {
      const text = (r.aiDraft || '') + ' ' + (r.category || '')
      return RECRUIT_KEYWORDS.some((kw) => text.includes(kw))
    }),
    [rows]
  )

  const keywordCounts = useMemo(() => {
    return RECRUIT_KEYWORDS.map((kw) => ({
      kw,
      count: rows.filter((r) => ((r.aiDraft || '') + ' ' + (r.category || '')).includes(kw)).length,
    }))
  }, [rows])

  if (matched.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💼</div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
            채용 관련 메일이 없습니다
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-mute)', maxWidth: '380px', margin: '0 auto', lineHeight: 1.6 }}>
            분류가 '채용'인 메일 또는 채용 관련 키워드(이력서, 면접, 지원 등)가 포함된 메일이 여기에 표시됩니다.
          </p>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-mute)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            채용 관련 키워드 감지
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {keywordCounts.map(({ kw, count }) => (
              <div key={kw} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'var(--surface-2)', borderRadius: '8px', padding: '12px 20px',
                minWidth: '80px',
              }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: count > 0 ? 'var(--accent)' : 'var(--text-mute)' }}>{count}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-mute)', marginTop: '2px' }}>{kw}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Kanban view
  const kanbanMap: Record<string, MailRow[]> = {}
  KANBAN_COLS.forEach((col) => { kanbanMap[col.id] = [] })

  matched.forEach((r) => {
    const text = r.aiDraft || ''
    let placed = false
    for (const col of KANBAN_COLS) {
      if (col.keywords.some((kw) => text.includes(kw))) {
        kanbanMap[col.id].push(r)
        placed = true
        break
      }
    }
    if (!placed) kanbanMap['지원접수'].push(r)
  })

  const colColors = ['var(--accent-3)', 'var(--accent-4)', 'var(--accent)', 'var(--accent-2)']

  return (
    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
      {KANBAN_COLS.map((col, ci) => (
        <div key={col.id} style={{ flex: '1 0 200px', minWidth: '200px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: colColors[ci], marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colColors[ci], display: 'inline-block' }} />
            {col.label}
            <span style={{ marginLeft: 'auto', ...pillStyle(colColors[ci]) }}>{kanbanMap[col.id].length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {kanbanMap[col.id].map((r) => (
              <div key={r.ticketId} style={{ ...cardStyle, padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {parseSenderName(r.sender)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-mute)', marginBottom: '8px' }}>{r.receivedAt}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {r.aiDraft}
                </div>
                {r.gmailLink && (
                  <a href={r.gmailLink} target="_blank" rel="noreferrer" style={{
                    display: 'inline-block', marginTop: '8px',
                    fontSize: '11px', color: 'var(--text-mute)', textDecoration: 'none',
                  }}>
                    Gmail →
                  </a>
                )}
              </div>
            ))}
            {kanbanMap[col.id].length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-mute)', background: 'var(--surface)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                없음
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
