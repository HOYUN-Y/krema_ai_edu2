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

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }} />
      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-mute)', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  )
}

export default function EmailSection({ rows }: EmailSectionProps) {
  const { topSenders, topDomains, domainImportance, replyRateByType } = useMemo(() => {
    const senderMap: Record<string, { count: number; name: string }> = {}
    const domainMap: Record<string, number> = {}
    const domainImportanceMap: Record<string, { total: number; count: number }> = {}
    const replyTypeMap: Record<string, { total: number; replied: number }> = {}

    rows.forEach((r) => {
      const { email, name } = parseEmail(r.sender)
      if (!email) return

      senderMap[email] = senderMap[email]
        ? { count: senderMap[email].count + 1, name: senderMap[email].name }
        : { count: 1, name }

      const domain = email.split('@')[1] || email
      domainMap[domain] = (domainMap[domain] || 0) + 1

      // Domain importance
      const imp = typeof r.importance === 'number' ? r.importance : parseFloat(String(r.importance))
      if (!isNaN(imp)) {
        if (!domainImportanceMap[domain]) domainImportanceMap[domain] = { total: 0, count: 0 }
        domainImportanceMap[domain].total += imp
        domainImportanceMap[domain].count += 1
      }

      // Reply rate by sender type
      const stype = r.senderType || '(없음)'
      if (!replyTypeMap[stype]) replyTypeMap[stype] = { total: 0, replied: 0 }
      replyTypeMap[stype].total += 1
      if (r.replied === '회신완료') replyTypeMap[stype].replied += 1
    })

    const topSenders = Object.entries(senderMap)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([email, { count, name }]) => ({ email, name, count }))

    const topDomains = Object.entries(domainMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }))

    const domainImportance = Object.entries(domainImportanceMap)
      .map(([domain, { total, count }]) => ({ domain, avg: total / count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8)

    const colorMap: Record<string, string> = {
      '외부고객': 'var(--accent)',
      '자동': 'var(--text-mute)',
      '마케팅': 'var(--text-mute)',
      '자동/마케팅': 'var(--text-mute)',
      '내부': 'var(--accent-3)',
    }

    const replyRateByType = Object.entries(replyTypeMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([type, { total, replied }]) => ({
        type,
        total,
        replied,
        rate: total > 0 ? Math.round((replied / total) * 100) : 0,
        color: colorMap[type] || 'var(--accent-3)',
      }))

    return { topSenders, topDomains, domainImportance, replyRateByType }
  }, [rows])

  const maxSenderCount = topSenders[0]?.count || 1
  const maxDomainAvg = domainImportance[0]?.avg || 10

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Row 1: Top senders + top domains */}
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
                  <div style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name || s.email}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.email}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ width: '60px', height: '4px', borderRadius: '2px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.round((s.count / maxSenderCount) * 100)}%`, background: AVATAR_COLORS[i % 4], borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text)', minWidth: '20px', textAlign: 'right' }}>
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
                <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontFamily: 'var(--font-geist-mono), monospace' }}>
                  @{d.domain}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: AVATAR_COLORS[i % 4], fontFamily: 'var(--font-geist-mono), monospace' }}>
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Domain importance + Reply rate by type */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Subsection 3: Domain importance */}
        <div style={{
          flex: 1,
          minWidth: '260px',
          background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
          boxShadow: 'inset 0 1px 0 var(--border), 0 0 0 1px var(--border)',
          borderRadius: '12px',
          padding: '20px 24px',
        }}>
          <SectionLabel label="도메인별 평균 중요도" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {domainImportance.map((d) => {
              const barPct = Math.round((d.avg / Math.max(maxDomainAvg, 10)) * 100)
              return (
                <div key={d.domain} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', width: '120px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-geist-mono), monospace' }}>
                    @{d.domain}
                  </span>
                  <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${barPct}%`,
                      background: 'color-mix(in oklch, var(--accent-4) 70%, transparent)',
                      borderRadius: '4px',
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text)', width: '32px', textAlign: 'right', fontFamily: 'var(--font-geist-mono), monospace' }}>
                    {d.avg.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Subsection 4: Reply rate by sender type */}
        <div style={{
          flex: 1,
          minWidth: '260px',
          background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
          boxShadow: 'inset 0 1px 0 var(--border), 0 0 0 1px var(--border)',
          borderRadius: '12px',
          padding: '20px 24px',
        }}>
          <SectionLabel label="발신자 유형별 회신율" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {replyRateByType.map((item) => (
              <div key={item.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{item.type}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color: item.color, fontWeight: 600 }}>
                    {item.rate}%
                  </span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: '4px' }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${item.rate}%`,
                    background: `color-mix(in oklch, ${item.color} 70%, transparent)`,
                    borderRadius: '4px',
                  }} />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-mute)' }}>
                  {item.total}건 중 {item.replied}건 회신
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
