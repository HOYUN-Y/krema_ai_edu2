'use client'

import type { MailRow } from '@/lib/types'
import Icon from './Icon'

interface KPIBandProps {
  rows: MailRow[]
}

function KPICard({
  label,
  value,
  color,
  sub,
}: {
  label: string
  value: string | number
  color: string
  sub?: string
}) {
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, var(--surface) 0%, oklch(13% 0.01 250) 100%)',
        boxShadow: 'inset 0 1px 0 var(--border), 0 0 0 1px var(--border)',
        borderRadius: '12px',
        padding: '20px 24px',
        flex: 1,
        minWidth: '160px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-mute)',
          marginBottom: '12px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '36px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-geist-mono), monospace',
          color: color,
          lineHeight: 1,
          marginBottom: sub ? '8px' : 0,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '12px', color: 'var(--text-mute)', marginTop: '4px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export default function KPIBand({ rows }: KPIBandProps) {
  const total = rows.length
  const needsReviewCount = rows.filter((r) => r.needsReview).length
  const delayedCount = rows.filter((r) => r.isDelayed).length
  const avgImportance =
    total > 0 ? (rows.reduce((s, r) => s + r.importance, 0) / total).toFixed(1) : '0.0'

  const delayedAndReview = rows.filter((r) => r.isDelayed && r.needsReview).length

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Hero diagnostic card */}
      <div
        style={{
          background:
            'linear-gradient(135deg, color-mix(in oklch, var(--accent-2) 12%, var(--surface)), var(--surface))',
          border: '1px solid color-mix(in oklch, var(--accent-2) 30%, var(--border))',
          borderLeft: '4px solid var(--accent-2)',
          borderRadius: '14px',
          padding: '16px 24px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Icon name="flame" size={18} color="var(--accent-2)" />
        <div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
            미회신 {needsReviewCount}건 중 {delayedAndReview}건 SLA 초과
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-mute)', marginLeft: '12px' }}>
            총 {total}건 중 지연 {delayedCount}건 ({total > 0 ? Math.round((delayedCount / total) * 100) : 0}%)
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <KPICard
          label="총 티켓"
          value={total}
          color="var(--accent)"
          sub="전체 수신 건수"
        />
        <KPICard
          label="미회신 (검토필요)"
          value={needsReviewCount}
          color="var(--accent-2)"
          sub={`전체의 ${total > 0 ? Math.round((needsReviewCount / total) * 100) : 0}%`}
        />
        <KPICard
          label="지연 건수"
          value={delayedCount}
          color="var(--accent-4)"
          sub="SLA 초과"
        />
        <KPICard
          label="평균 중요도"
          value={avgImportance}
          color="var(--accent-3)"
          sub="1–5 척도"
        />
      </div>
    </div>
  )
}
