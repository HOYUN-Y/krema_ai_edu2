'use client'

import { useState, useMemo } from 'react'
import type { MailRow } from '@/lib/types'
import Icon from './Icon'

interface Props { rows: MailRow[] }

function parseSenderName(sender: string): string {
  const m = sender.match(/^(.+?)\s*</)
  return m ? m[1].trim() : sender.split('@')[0]
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

export default function AISummarySection({ rows }: Props) {
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() =>
    rows
      .filter((r) => r.aiDraft && !r.aiDraft.includes('회신 불필요') && !r.aiDraft.includes('회신 완료'))
      .sort((a, b) => b.importance - a.importance),
    [rows]
  )

  const displayed = showAll ? filtered : filtered.slice(0, 20)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        총 {filtered.length}건의 AI 요약 메일
      </div>

      {filtered.length === 0 && (
        <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', textAlign: 'center', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Icon name="mail" size={32} color="var(--text-mute)" />
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dim)' }}>AI 요약이 있는 메일이 없습니다</div>
          <div style={{ fontSize: '12px', color: 'var(--text-mute)' }}>AI 초안이 생성된 메일이 표시됩니다</div>
        </div>
      )}

      {displayed.map((r) => (
        <div key={r.ticketId} style={cardStyle}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <span style={pillStyle('var(--accent-3)')}>{r.category}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{parseSenderName(r.sender)}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-mute)' }}>{r.receivedAt}</span>
              {r.isDelayed && <span style={pillStyle('var(--accent-2)')}>SLA 초과</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <span style={{
                fontSize: '13px', fontWeight: 700, color: 'var(--accent-4)',
                background: `color-mix(in oklch, var(--accent-4) 12%, transparent)`,
                borderRadius: '6px', padding: '2px 8px',
              }}>
                {r.importance}
              </span>
              {r.gmailLink && (
                <a href={r.gmailLink} target="_blank" rel="noreferrer" style={{
                  padding: '6px 12px', borderRadius: '6px', fontSize: '11px',
                  border: '1px solid var(--border)', color: 'var(--text-dim)',
                  textDecoration: 'none',
                }}>
                  Gmail 열기 →
                </a>
              )}
            </div>
          </div>

          {/* AI Draft blockquote */}
          <div style={{
            background: 'var(--surface-2)',
            borderLeft: '3px solid var(--accent)',
            borderRadius: '0 8px 8px 0',
            padding: '12px 16px',
            fontSize: '13px',
            lineHeight: '1.7',
            color: 'var(--text)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {r.aiDraft}
          </div>
        </div>
      ))}

      {filtered.length > 20 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            padding: '10px', borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-dim)',
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          더 보기 ({filtered.length - 20}건 더)
        </button>
      )}
    </div>
  )
}
