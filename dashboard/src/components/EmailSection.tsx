'use client'

import { useMemo } from 'react'
import type { MailRow } from '@/lib/types'

interface EmailSectionProps {
  rows: MailRow[]
}

function parseEmail(raw: string): { name: string; email: string } {
  const m = raw.match(/^(.+?)\s*<([^>]+)>$/)
  if (m) return { name: m[1].trim(), email: m[2].trim() }
  return { name: raw, email: raw }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'var(--accent)',
  'var(--accent-2)',
  'var(--accent-3)',
  'var(--accent-4)',
]

export default function EmailSection({ rows }: EmailSectionProps) {
  const { topSenders, topDomains } = useMemo(() => {
    const senderMap: Record<string, { count: number; name: string }> = {}
    const domainMap: Record<string, number> = {}

    rows.forEach((r) => {
      const { email, name } = parseEmail(r.sender)
      if (!email) return
      senderMap[email] = senderMap[email]
        ? { count: senderMap[email].count + 1, name: senderMap[email].name }
        : { count: 1, name }
      const domain = email.split('@')[1] || email
      domainMap[domain] = (domainMap[domain] || 0) + 1
    })

    const topSenders = Object.entries(senderMap)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([email, { count, name }]) => ({ email, name, count }))

    const topDomains = Object.entries(domainMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }))

    return { topSenders, topDomains }
  }, [rows])

  const maxSenderCount = topSenders[0]?.count || 1

  return (
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
      <div style={{ flex: 2, minWidth: '300px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-mute)', marginBottom: '16px' }}>
          상위 발신자 TOP 10
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topSenders.map((s, i) => (
            <div
              key={s.email}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--surface-2)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: AVATAR_COLORS[i % 4],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--bg)',
                  flexShrink: 0,
                }}
              >
                {getInitials(s.name || s.email)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.name || s.email}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-mute)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.email}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'var(--border)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${Math.round((s.count / maxSenderCount) * 100)}%`,
                      background: AVATAR_COLORS[i % 4],
                      borderRadius: '2px',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-geist-mono), monospace',
                    color: 'var(--text)',
                    minWidth: '20px',
                    textAlign: 'right',
                  }}
                >
                  {s.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-mute)', marginBottom: '16px' }}>
          상위 도메인 TOP 5
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topDomains.map((d, i) => (
            <div
              key={d.domain}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--surface-2)',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}
              >
                @{d.domain}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: AVATAR_COLORS[i % 4],
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}
              >
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
