'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SheetData } from '@/lib/types'
import KPIBand from './KPIBand'
import SectionWrapper from './SectionWrapper'
import TimelineSection from './TimelineSection'
import CategorySection from './CategorySection'
import EmailSection from './EmailSection'
import ReviewSection from './ReviewSection'
import TableSection from './TableSection'

interface DashboardProps {
  data: SheetData
}

const SECTIONS = ['수신 추이', '분류 분포', '발신자 분석', '검토 필요', '전체 데이터']

export default function Dashboard({ data }: DashboardProps) {
  const router = useRouter()
  const [allExpanded, setAllExpanded] = useState(true)
  const [expanded, setExpanded] = useState<boolean[]>(SECTIONS.map(() => true))

  function toggleAll() {
    const next = !allExpanded
    setAllExpanded(next)
    setExpanded(SECTIONS.map(() => next))
  }

  function toggleSection(i: number) {
    setExpanded((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  const fetchedDate = new Date(data.fetchedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text)',
              marginBottom: '4px',
            }}
          >
            📬 Mail Dashboard
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-mute)' }}>
            마지막 업데이트: {fetchedDate} · 총 {data.rows.length}건
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={toggleAll}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-dim)',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
          >
            {allExpanded ? '모두 접기' : '모두 펼치기'}
          </button>
          <button
            onClick={() => router.refresh()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid color-mix(in oklch, var(--accent) 30%, var(--border))',
              background: 'color-mix(in oklch, var(--accent) 10%, var(--surface))',
              color: 'var(--accent)',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'color-mix(in oklch, var(--accent) 18%, var(--surface))')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'color-mix(in oklch, var(--accent) 10%, var(--surface))')
            }
          >
            ↻ 새로고침
          </button>
        </div>
      </div>

      {/* KPI */}
      <KPIBand rows={data.rows} />

      {/* Sections */}
      <SectionWrapper
        title={SECTIONS[0]}
        expanded={expanded[0]}
        onToggle={() => toggleSection(0)}
      >
        <TimelineSection rows={data.rows} />
      </SectionWrapper>

      <SectionWrapper
        title={SECTIONS[1]}
        expanded={expanded[1]}
        onToggle={() => toggleSection(1)}
      >
        <CategorySection rows={data.rows} />
      </SectionWrapper>

      <SectionWrapper
        title={SECTIONS[2]}
        expanded={expanded[2]}
        onToggle={() => toggleSection(2)}
      >
        <EmailSection rows={data.rows} />
      </SectionWrapper>

      <SectionWrapper
        title={SECTIONS[3]}
        expanded={expanded[3]}
        onToggle={() => toggleSection(3)}
      >
        <ReviewSection rows={data.rows} />
      </SectionWrapper>

      <SectionWrapper
        title={SECTIONS[4]}
        expanded={expanded[4]}
        onToggle={() => toggleSection(4)}
      >
        <TableSection rows={data.rows} />
      </SectionWrapper>
    </div>
  )
}
