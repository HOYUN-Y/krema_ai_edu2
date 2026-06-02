'use client'

import { useMemo } from 'react'
import type { MailRow } from '@/lib/types'
import Icon from './Icon'

interface Props { rows: MailRow[] }

function parseSenderName(sender: string): string {
  const m = sender.match(/^(.+?)\s*</)
  return m ? m[1].trim() : sender.split('@')[0]
}

const KEYWORDS: { word: string; iconName: string; type: string }[] = [
  { word: '계약서', iconName: 'penTool', type: '계약/서명' },
  { word: '서명', iconName: 'penTool', type: '계약/서명' },
  { word: '서명 페이지', iconName: 'penTool', type: '계약/서명' },
  { word: 'PDF', iconName: 'fileText', type: '자료' },
  { word: '문서', iconName: 'fileText', type: '자료' },
  { word: '자료', iconName: 'barChart', type: '자료' },
  { word: '파일', iconName: 'fileText', type: '자료' },
  { word: '첨부', iconName: 'fileText', type: '자료' },
  { word: 'Teams', iconName: 'link', type: '링크' },
  { word: '링크', iconName: 'link', type: '링크' },
]

interface AttachmentMatch {
  row: MailRow
  keyword: string
  iconName: string
  type: string
  excerpt: string
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

export default function AttachmentSection({ rows }: Props) {
  const matches = useMemo<AttachmentMatch[]>(() => {
    const results: AttachmentMatch[] = []
    rows.forEach((row) => {
      const text = row.aiDraft || ''
      // Find first matching keyword for this row
      for (const kw of KEYWORDS) {
        const idx = text.indexOf(kw.word)
        if (idx !== -1) {
          const start = Math.max(0, idx - 40)
          const end = Math.min(text.length, idx + 40)
          results.push({
            row,
            keyword: kw.word,
            iconName: kw.iconName,
            type: kw.type,
            excerpt: text.slice(start, end).trim(),
          })
          break // one per row
        }
      }
    })
    return results
  }, [rows])

  const contractCount = matches.filter((m) => m.type === '계약/서명').length
  const dataCount = matches.filter((m) => m.type === '자료').length
  const linkCount = matches.filter((m) => m.type === '링크').length

  if (matches.length === 0) {
    return (
      <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <Icon name="paperclip" size={32} color="var(--text-mute)" />
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dim)' }}>감지된 첨부파일 관련 메일이 없습니다</div>
        <div style={{ fontSize: '12px', color: 'var(--text-mute)' }}>계약서, 문서, 링크 관련 키워드가 포함된 메일이 표시됩니다</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary */}
      <div style={{ ...cardStyle, padding: '12px 20px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 500 }}>
          계약/서명 <strong style={{ color: 'var(--accent-2)' }}>{contractCount}건</strong>
          &nbsp;·&nbsp;
          자료 요청 <strong style={{ color: 'var(--accent-3)' }}>{dataCount}건</strong>
          &nbsp;·&nbsp;
          링크 <strong style={{ color: 'var(--accent)' }}>{linkCount}건</strong>
        </span>
      </div>

      {matches.map((m, idx) => (
        <div key={idx} style={{ ...cardStyle, display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, marginTop: '2px' }}><Icon name={m.iconName} size={20} color="var(--text-mute)" /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{parseSenderName(m.row.sender)}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-mute)' }}>{m.row.receivedAt}</span>
                <span style={pillStyle('var(--accent-3)')}>{m.row.category}</span>
                {m.row.status === '수동조치' && <span style={pillStyle('var(--accent-4)')}>서명 필요</span>}
              </div>
              {m.row.gmailLink && (
                <a href={m.row.gmailLink} target="_blank" rel="noreferrer" style={{
                  padding: '5px 10px', borderRadius: '6px', fontSize: '11px',
                  border: '1px solid var(--border)', color: 'var(--text-dim)',
                  textDecoration: 'none', flexShrink: 0,
                }}>
                  Gmail →
                </a>
              )}
            </div>
            <div style={{
              fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6',
              background: 'var(--surface-2)', borderRadius: '6px', padding: '8px 12px',
            }}>
              {m.excerpt.split(m.keyword).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <mark style={{ background: 'color-mix(in oklch, var(--accent-4) 30%, transparent)', borderRadius: '2px', padding: '0 2px', color: 'var(--text)' }}>
                      {m.keyword}
                    </mark>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
