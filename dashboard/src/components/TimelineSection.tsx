'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MailRow } from '@/lib/types'

interface TimelineSectionProps {
  rows: MailRow[]
}

function parseDateStr(s: string): Date | null {
  if (!s) return null
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d
  const m = s.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return null
}

const MINI_CARD_STYLE: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

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

function MiniLabel({ label }: { label: string }) {
  return (
    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-mute)', fontWeight: 500 }}>
      {label}
    </span>
  )
}

export default function TimelineSection({ rows }: TimelineSectionProps) {
  const dailyCounts = useMemo(() => {
    const map: Record<string, number> = {}
    rows.forEach((r) => {
      const d = parseDateStr(r.receivedAt)
      if (!d) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }))
  }, [rows])

  const heatmapData = useMemo(() => {
    const map: Record<string, number> = {}
    rows.forEach((r) => {
      const d = parseDateStr(r.receivedAt)
      if (!d) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map[key] = (map[key] || 0) + 1
    })

    const today = new Date()
    const cells: { date: string; day: number; count: number }[] = []
    for (let i = 55; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      cells.push({ date: key, day: d.getDay(), count: map[key] || 0 })
    }
    return cells
  }, [rows])

  // Summary stats
  const summary = useMemo(() => {
    // Top categories
    const catMap: Record<string, number> = {}
    rows.forEach((r) => { catMap[r.category || '(없음)'] = (catMap[r.category || '(없음)'] || 0) + 1 })
    const topCategories = Object.entries(catMap).sort(([, a], [, b]) => b - a).slice(0, 3)

    // Status counts
    const statusMap: Record<string, number> = {}
    rows.forEach((r) => { statusMap[r.status || '(없음)'] = (statusMap[r.status || '(없음)'] || 0) + 1 })

    // Sender types
    const senderTypeMap: Record<string, number> = {}
    rows.forEach((r) => { senderTypeMap[r.senderType || '(없음)'] = (senderTypeMap[r.senderType || '(없음)'] || 0) + 1 })

    // Languages
    const langMap: Record<string, number> = {}
    rows.forEach((r) => { langMap[r.language || '(없음)'] = (langMap[r.language || '(없음)'] || 0) + 1 })
    const topLangs = Object.entries(langMap).sort(([, a], [, b]) => b - a).slice(0, 5)

    // Sentiment
    const sentMap: Record<string, number> = {}
    rows.forEach((r) => { sentMap[r.sentiment || '(없음)'] = (sentMap[r.sentiment || '(없음)'] || 0) + 1 })

    // Reply stats
    const totalRows = rows.length
    const repliedCount = rows.filter((r) => r.replied === '회신완료').length
    const slaDelayed = rows.filter((r) => r.isDelayed === true || String(r.isDelayed) === 'true' || String(r.isDelayed) === 'Y').length

    return {
      topCategories,
      statusMap,
      senderTypeMap,
      topLangs,
      sentMap,
      totalRows,
      repliedCount,
      slaDelayed,
    }
  }, [rows])

  const maxCount = Math.max(...heatmapData.map((c) => c.count), 1)
  const days = ['일', '월', '화', '수', '목', '금', '토']

  const weeks: (typeof heatmapData)[] = []
  let week: typeof heatmapData = []
  heatmapData.forEach((cell) => {
    if (cell.day === 0 && week.length > 0) {
      weeks.push(week)
      week = []
    }
    week.push(cell)
  })
  if (week.length > 0) weeks.push(week)

  const maxSenderTypeCount = Math.max(...Object.values(summary.senderTypeMap), 1)

  const positiveCount = summary.sentMap['긍정'] || 0
  const neutralCount = summary.sentMap['중립'] || 0
  const negativeCount = summary.sentMap['부정'] || 0

  const unrepliedCount = summary.totalRows - summary.repliedCount
  const replyPct = summary.totalRows > 0 ? Math.round((unrepliedCount / summary.totalRows) * 100) : 0

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-mute)', marginBottom: '12px' }}>
          일별 수신량
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={dailyCounts}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-mute)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'var(--text-mute)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#areaGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-mute)', marginBottom: '12px' }}>
          활동 히트맵 (최근 8주)
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '2px' }}>
            {days.map((d) => (
              <div
                key={d}
                style={{ fontSize: '9px', color: 'var(--text-mute)', height: '16px', lineHeight: '16px', width: '12px' }}
              >
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '3px', flex: 1, flexWrap: 'wrap' }}>
            {weeks.map((w, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {Array.from({ length: 7 }).map((_, di) => {
                  const cell = w.find((c) => c.day === di)
                  const intensity = cell ? Math.round((cell.count / maxCount) * 100) : 0
                  return (
                    <div
                      key={di}
                      title={cell ? `${cell.date}: ${cell.count}건` : ''}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        background:
                          intensity > 0
                            ? `color-mix(in oklch, var(--accent) ${Math.max(intensity, 12)}%, var(--border))`
                            : 'var(--border)',
                        cursor: cell ? 'pointer' : 'default',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (cell?.count) e.currentTarget.style.transform = 'scale(1.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 현황 요약 */}
      <div style={{ marginTop: '32px' }}>
        <SectionLabel label="현황 요약" />

        {/* Row 1: 4 mini stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          {/* Card 1: 분류 TOP 3 */}
          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="분류별" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
              {summary.topCategories.map(([name, count]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-geist-mono), monospace',
                    color: 'var(--bg)',
                    background: 'var(--accent)',
                    borderRadius: '4px',
                    padding: '1px 5px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: 처리상태 */}
          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="처리상태" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
              {[
                { key: '신규(대기)', colorVar: 'var(--accent-4)' },
                { key: '조치필요', colorVar: 'var(--accent-2)' },
                { key: '회신완료', colorVar: 'var(--accent)' },
                { key: '자동분류', colorVar: 'var(--text-mute)' },
              ].map(({ key, colorVar }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: colorVar, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', flex: 1 }}>{key}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color: colorVar, fontWeight: 600 }}>
                    {summary.statusMap[key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: 발신자 유형 */}
          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="발신자 유형" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '4px' }}>
              {Object.entries(summary.senderTypeMap).sort(([, a], [, b]) => b - a).slice(0, 4).map(([type, count]) => {
                const pct = Math.round((count / maxSenderTypeCount) * 100)
                return (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{type}</span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-mute)' }}>{count}</span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: 'var(--accent-3)', borderRadius: '2px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card 4: 언어 */}
          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="언어별" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
              {summary.topLangs.map(([lang, count]) => (
                <div key={lang} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{lang}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-mute)', fontWeight: 600 }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Wide cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {/* Card 5: 감정 분포 */}
          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="감정 분포" />
            <div style={{ display: 'flex', gap: '0', marginTop: '8px' }}>
              {[
                { label: '긍정', count: positiveCount, color: 'var(--accent)' },
                { label: '중립', count: neutralCount, color: 'var(--text-dim)' },
                { label: '부정', count: negativeCount, color: 'var(--accent-2)' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color, fontFamily: 'var(--font-geist-mono), monospace', lineHeight: 1 }}>
                    {count}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-mute)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 6: 회신 현황 */}
          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="회신 현황" />
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'var(--font-geist-mono), monospace', lineHeight: 1 }}>
                  {unrepliedCount}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-mute)' }}>미회신</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-geist-mono), monospace', lineHeight: 1 }}>
                  {summary.repliedCount}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-mute)' }}>회신완료</span>
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${replyPct}%`, background: 'var(--accent-2)', borderRadius: '3px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-mute)' }}>미회신 {replyPct}%</span>
                <span style={{ fontSize: '10px', color: 'var(--accent-2)' }}>SLA 지연 {summary.slaDelayed}건</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
