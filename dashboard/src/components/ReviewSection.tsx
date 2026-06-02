'use client'

import { useMemo } from 'react'
import type { MailRow } from '@/lib/types'

interface ReviewSectionProps {
  rows: MailRow[]
}

const CATEGORY_COLORS = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', 'var(--accent-4)']

const SENTIMENT_COLORS: Record<string, string> = {
  긍정: 'var(--accent)',
  부정: 'var(--accent-2)',
  중립: 'var(--accent-3)',
}

function Pill({
  label,
  color,
  glow,
}: {
  label: string
  color: string
  glow?: boolean
}) {
  return (
    <span
      style={{
        borderRadius: '999px',
        padding: '2px 10px',
        background: `color-mix(in oklch, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
        fontSize: '11px',
        color,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        boxShadow: glow
          ? `0 0 8px color-mix(in oklch, ${color} 40%, transparent)`
          : 'none',
      }}
    >
      {label}
    </span>
  )
}

const categoryColorCache: Record<string, string> = {}
let categoryColorIdx = 0

function getCategoryColor(cat: string): string {
  if (!categoryColorCache[cat]) {
    categoryColorCache[cat] = CATEGORY_COLORS[categoryColorIdx % CATEGORY_COLORS.length]
    categoryColorIdx++
  }
  return categoryColorCache[cat]
}

export default function ReviewSection({ rows }: ReviewSectionProps) {
  const reviewRows = useMemo(
    () =>
      rows
        .filter((r) => r.needsReview)
        .sort((a, b) => b.importance - a.importance),
    [rows]
  )

  if (reviewRows.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-mute)',
          fontSize: '14px',
        }}
      >
        검토 필요 항목이 없습니다.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
      {reviewRows.map((row) => {
        const sentimentColor = SENTIMENT_COLORS[row.sentiment] || 'var(--text-mute)'
        const catColor = getCategoryColor(row.category)

        return (
          <div
            key={row.ticketId}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.sender}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-mute)',
                    fontFamily: 'var(--font-geist-mono), monospace',
                    marginTop: '2px',
                  }}
                >
                  {row.ticketId}
                </div>
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  color: row.importance >= 4 ? 'var(--accent-2)' : 'var(--accent-4)',
                  flexShrink: 0,
                }}
              >
                P{row.importance}
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {row.category && (
                <Pill label={row.category} color={catColor} />
              )}
              {row.sentiment && (
                <Pill label={row.sentiment} color={sentimentColor} />
              )}
              {row.isDelayed && (
                <Pill label="⚠ SLA 초과" color="var(--accent-2)" glow />
              )}
            </div>

            {/* AI Draft */}
            {row.aiDraft && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-dim)',
                  lineHeight: 1.6,
                  padding: '10px',
                  background: 'var(--surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {row.aiDraft.slice(0, 150)}
                {row.aiDraft.length > 150 ? '…' : ''}
              </div>
            )}

            {/* Footer */}
            {row.gmailLink && (
              <a
                href={row.gmailLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--accent-3)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid color-mix(in oklch, var(--accent-3) 25%, var(--border))',
                  background: 'color-mix(in oklch, var(--accent-3) 8%, transparent)',
                  alignSelf: 'flex-start',
                  transition: 'background 0.15s',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2h8M10 2v8M2 10l8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Gmail 열기
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}
