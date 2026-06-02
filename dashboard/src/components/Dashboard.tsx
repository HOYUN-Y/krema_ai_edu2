'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SheetData } from '@/lib/types'
import KPIBand from './KPIBand'
import TimelineSection from './TimelineSection'
import CategorySection from './CategorySection'
import EmailSection from './EmailSection'
import ReviewSection from './ReviewSection'
import TableSection from './TableSection'
import ImportanceSection from './ImportanceSection'
import AISummarySection from './AISummarySection'
import ScheduleSection from './ScheduleSection'
import AttachmentSection from './AttachmentSection'
import RecruitmentSection from './RecruitmentSection'

interface DashboardProps {
  data: SheetData
}

const TABS = [
  { id: '메일 현황', icon: '📬' },
  { id: '중요도 분석', icon: '📊' },
  { id: '답장 필요', icon: '📩' },
  { id: 'AI 요약', icon: '🤖' },
  { id: '일정 추출', icon: '📅' },
  { id: '첨부파일', icon: '📎' },
  { id: '메일 통계', icon: '📈' },
  { id: '채용 관리', icon: '💼' },
]

export default function Dashboard({ data }: DashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('메일 현황')

  const fetchedDate = new Date(data.fetchedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={{
        width: '200px',
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '24px 0',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>📬 Mail Dashboard</div>
        </div>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                borderRadius: '8px',
                margin: '2px 8px',
                width: 'calc(100% - 16px)',
                textAlign: 'left',
                border: 'none',
                background: isActive
                  ? 'color-mix(in oklch, var(--accent) 12%, transparent)'
                  : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                fontWeight: isActive ? 600 : 400,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'color-mix(in oklch, var(--accent) 6%, transparent)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.id}</span>
            </button>
          )
        })}
      </nav>

      {/* Main content */}
      <main style={{ marginLeft: '200px', padding: '32px', flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
              {TABS.find((t) => t.id === activeTab)?.icon} {activeTab}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-mute)' }}>
              마지막 업데이트: {fetchedDate} · 총 {data.rows.length}건
            </p>
          </div>
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
              cursor: 'pointer',
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

        {/* KPI always visible */}
        <div style={{ marginBottom: '24px' }}>
          <KPIBand rows={data.rows} />
        </div>

        {/* Tab content */}
        <div>
          {activeTab === '메일 현황' && <TimelineSection rows={data.rows} />}
          {activeTab === '중요도 분석' && <ImportanceSection rows={data.rows} />}
          {activeTab === '답장 필요' && <ReviewSection rows={data.rows} />}
          {activeTab === 'AI 요약' && <AISummarySection rows={data.rows} />}
          {activeTab === '일정 추출' && <ScheduleSection rows={data.rows} />}
          {activeTab === '첨부파일' && <AttachmentSection rows={data.rows} />}
          {activeTab === '메일 통계' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <CategorySection rows={data.rows} />
              <EmailSection rows={data.rows} />
            </div>
          )}
          {activeTab === '채용 관리' && <RecruitmentSection rows={data.rows} />}
        </div>
      </main>
    </div>
  )
}
