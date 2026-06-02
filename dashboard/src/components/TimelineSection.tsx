'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
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

const PERIOD_OPTIONS = [
  { label: '4주', days: 28 },
  { label: '8주', days: 56 },
  { label: '12주', days: 84 },
  { label: '26주', days: 182 },
]

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function TimelineSection({ rows }: TimelineSectionProps) {
  const [periodDays, setPeriodDays] = useState(56)
  const heatmapRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)

  useEffect(() => {
    const el = heatmapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const dateCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    rows.forEach((r) => {
      const d = parseDateStr(r.receivedAt)
      if (!d) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [rows])

  const dailyCounts = useMemo(() => {
    return Object.entries(dateCountMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }))
  }, [dateCountMap])

  // Heatmap cells based on selected period
  const { heatmapCells, weeks } = useMemo(() => {
    const today = new Date('2026-06-02') // fixed today for consistency
    const cells: { date: string; day: number; count: number; monthLabel?: string }[] = []

    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      // Mark first day of month for label
      const monthLabel = d.getDate() === 1
        ? `${d.getMonth() + 1}월`
        : undefined
      cells.push({ date: key, day: d.getDay(), count: dateCountMap[key] || 0, monthLabel })
    }

    // Group into weeks (starting Sunday)
    const weekGroups: typeof cells[] = []
    let currentWeek: typeof cells = []

    // Pad the first week if it doesn't start on Sunday
    const firstDay = cells[0]?.day ?? 0
    for (let p = 0; p < firstDay; p++) {
      currentWeek.push({ date: '', day: p, count: -1 }) // -1 = padding
    }

    cells.forEach((cell) => {
      if (cell.day === 0 && currentWeek.length > 0) {
        weekGroups.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(cell)
    })
    if (currentWeek.length > 0) weekGroups.push(currentWeek)

    return { heatmapCells: cells, weeks: weekGroups }
  }, [dateCountMap, periodDays])

  const maxCount = Math.max(...heatmapCells.map((c) => c.count), 1)

  // 셀 크기 동적 계산: 컨테이너 폭 기준, 8~16px 범위로 클램프
  const DAY_LABEL_W = 22
  const GAP = 3
  const cellSize = useMemo(() => {
    const numWeeks = weeks.length
    if (numWeeks === 0) return 13
    const available = containerWidth - DAY_LABEL_W - GAP - GAP * (numWeeks - 1)
    const computed = Math.floor(available / numWeeks)
    return Math.max(8, Math.min(computed, 16))
  }, [containerWidth, weeks.length])

  // Day-of-week pattern
  const dowPattern = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]
    heatmapCells.forEach((c) => {
      if (c.count > 0) counts[c.day] += c.count
    })
    return DAY_LABELS.map((label, i) => ({ label, count: counts[i] }))
  }, [heatmapCells])

  const maxDow = Math.max(...dowPattern.map((d) => d.count), 1)

  // Month labels for heatmap x-axis
  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; label: string }[] = []
    weeks.forEach((week, wi) => {
      const firstWithMonth = week.find((c) => c.monthLabel)
      if (firstWithMonth?.monthLabel) {
        labels.push({ weekIndex: wi, label: firstWithMonth.monthLabel })
      }
    })
    return labels
  }, [weeks])

  // Summary stats
  const summary = useMemo(() => {
    const catMap: Record<string, number> = {}
    rows.forEach((r) => { catMap[r.category || '(없음)'] = (catMap[r.category || '(없음)'] || 0) + 1 })
    const topCategories = Object.entries(catMap).sort(([, a], [, b]) => b - a).slice(0, 3)

    const statusMap: Record<string, number> = {}
    rows.forEach((r) => { statusMap[r.status || '(없음)'] = (statusMap[r.status || '(없음)'] || 0) + 1 })

    const senderTypeMap: Record<string, number> = {}
    rows.forEach((r) => { senderTypeMap[r.senderType || '(없음)'] = (senderTypeMap[r.senderType || '(없음)'] || 0) + 1 })

    const langMap: Record<string, number> = {}
    rows.forEach((r) => { langMap[r.language || '(없음)'] = (langMap[r.language || '(없음)'] || 0) + 1 })
    const topLangs = Object.entries(langMap).sort(([, a], [, b]) => b - a).slice(0, 5)

    const sentMap: Record<string, number> = {}
    rows.forEach((r) => { sentMap[r.sentiment || '(없음)'] = (sentMap[r.sentiment || '(없음)'] || 0) + 1 })

    const totalRows = rows.length
    const repliedCount = rows.filter((r) => r.replied === '회신완료').length
    const slaDelayed = rows.filter((r) => r.isDelayed).length

    return { topCategories, statusMap, senderTypeMap, topLangs, sentMap, totalRows, repliedCount, slaDelayed }
  }, [rows])

  const maxSenderTypeCount = Math.max(...Object.values(summary.senderTypeMap), 1)
  const positiveCount = summary.sentMap['긍정'] || 0
  const neutralCount = summary.sentMap['중립'] || 0
  const negativeCount = summary.sentMap['부정'] || 0
  const unrepliedCount = summary.totalRows - summary.repliedCount
  const replyPct = summary.totalRows > 0 ? Math.round((unrepliedCount / summary.totalRows) * 100) : 0

  return (
    <div>
      {/* 일별 수신량 */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-mute)', marginBottom: '12px' }}>일별 수신량</div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={dailyCounts}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: 'var(--text-mute)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: 'var(--text-mute)', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }} />
            <Area type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} fill="url(#areaGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 히트맵 */}
      <div>
        {/* Header: label + period selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-mute)' }}>활동 히트맵</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {PERIOD_OPTIONS.map((opt) => {
              const isActive = periodDays === opt.days
              return (
                <button
                  key={opt.label}
                  onClick={() => setPeriodDays(opt.days)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: isActive ? 600 : 400,
                    border: isActive
                      ? '1px solid color-mix(in oklch, var(--accent) 50%, transparent)'
                      : '1px solid var(--border)',
                    background: isActive
                      ? 'color-mix(in oklch, var(--accent) 15%, transparent)'
                      : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-mute)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 히트맵 + 요일별 패턴을 가로로 나란히 */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* 왼쪽: 히트맵 */}
          <div style={{ flex: 'none' }}>
            {/* Month labels */}
            {monthLabels.length > 0 && (
              <div style={{ marginLeft: DAY_LABEL_W + GAP, marginBottom: '4px', position: 'relative', height: '14px' }}>
                {monthLabels.map(({ weekIndex, label }) => (
                  <div
                    key={`${weekIndex}-${label}`}
                    style={{
                      position: 'absolute',
                      left: weekIndex * (cellSize + GAP),
                      fontSize: '10px',
                      color: 'var(--text-mute)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}

            {/* Grid — ref로 폭 측정 */}
            <div ref={heatmapRef} style={{ display: 'flex', gap: `${GAP}px`, alignItems: 'flex-start' }}>
              {/* Day labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, flexShrink: 0, width: DAY_LABEL_W }}>
                {DAY_LABELS.map((d, i) => (
                  <div key={d} style={{
                    fontSize: '9px',
                    color: i % 2 === 1 ? 'var(--text-mute)' : 'transparent',
                    height: cellSize,
                    lineHeight: `${cellSize}px`,
                    userSelect: 'none',
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div style={{ display: 'flex', gap: `${GAP}px` }}>
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
                    {Array.from({ length: 7 }).map((_, di) => {
                      const cell = week.find((c) => c.day === di)
                      const isPadding = cell?.count === -1
                      const intensity = (cell && !isPadding && cell.count > 0)
                        ? Math.round((cell.count / maxCount) * 100)
                        : 0
                      return (
                        <div
                          key={di}
                          title={cell && !isPadding && cell.count > 0 ? `${cell.date}: ${cell.count}건` : undefined}
                          style={{
                            width: cellSize,
                            height: cellSize,
                            borderRadius: Math.max(2, Math.floor(cellSize / 4)),
                            background: isPadding
                              ? 'transparent'
                              : intensity > 0
                                ? `color-mix(in oklch, var(--accent) ${Math.max(intensity, 15)}%, var(--border))`
                                : 'var(--border)',
                            cursor: (!isPadding && cell && cell.count > 0) ? 'pointer' : 'default',
                            transition: 'transform 0.1s',
                            opacity: isPadding ? 0 : 1,
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            if (!isPadding && cell && cell.count > 0) e.currentTarget.style.transform = 'scale(1.3)'
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

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-mute)' }}>적음</span>
              {[15, 35, 55, 75, 100].map((pct) => (
                <div key={pct} style={{ width: cellSize, height: cellSize, borderRadius: Math.max(2, Math.floor(cellSize / 4)), background: `color-mix(in oklch, var(--accent) ${pct}%, var(--border))` }} />
              ))}
              <span style={{ fontSize: '10px', color: 'var(--text-mute)' }}>많음</span>
            </div>
          </div>

          {/* 오른쪽: 요일별 수신 패턴 — 히트맵 높이에 맞춤 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: 'var(--text-mute)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              요일별 수신 패턴
            </div>
            {/* 수직 바 차트: 히트맵 높이(7*cellSize + 6*GAP)에 맞춤 */}
            <ResponsiveContainer width="100%" height={7 * cellSize + 6 * GAP + 24}>
              <BarChart data={dowPattern} barCategoryGap="25%" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-mute)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }}
                  formatter={(v: number) => [`${v}건`, '수신']}
                  cursor={{ fill: 'color-mix(in oklch, var(--accent) 8%, transparent)' }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {dowPattern.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.count === maxDow
                        ? 'oklch(82% 0.18 142)'
                        : `color-mix(in oklch, var(--accent) 45%, var(--border))`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>

      {/* 현황 요약 */}
      <div style={{ marginTop: '32px' }}>
        <SectionLabel label="현황 요약" />

        {/* Row 1: 4 mini stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          {/* 분류 TOP 3 */}
          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="분류별" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
              {summary.topCategories.map(([name, count]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--bg)', background: 'var(--accent)', borderRadius: '4px', padding: '1px 5px', fontWeight: 600, flexShrink: 0 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 처리상태 */}
          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="처리상태" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
              {[
                { key: '신규(대기)', color: 'var(--accent-4)' },
                { key: '조치필요', color: 'var(--accent-2)' },
                { key: '회신완료', color: 'var(--accent)' },
                { key: '자동분류', color: 'var(--text-mute)' },
              ].map(({ key, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', flex: 1 }}>{key}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color, fontWeight: 600 }}>{summary.statusMap[key] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 발신자 유형 */}
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

          {/* 언어별 */}
          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="언어별" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
              {summary.topLangs.map(([lang, count]) => (
                <div key={lang} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{lang}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-mute)', fontWeight: 600 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: 감정 분포 + 회신 현황 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="감정 분포" />
            <div style={{ display: 'flex', gap: '0', marginTop: '8px' }}>
              {[
                { label: '긍정', count: positiveCount, color: 'var(--accent)' },
                { label: '중립', count: neutralCount, color: 'var(--text-dim)' },
                { label: '부정', count: negativeCount, color: 'var(--accent-2)' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color, fontFamily: 'var(--font-geist-mono), monospace', lineHeight: 1 }}>{count}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-mute)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={MINI_CARD_STYLE}>
            <MiniLabel label="회신 현황" />
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'var(--font-geist-mono), monospace', lineHeight: 1 }}>{unrepliedCount}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-mute)' }}>미회신</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-geist-mono), monospace', lineHeight: 1 }}>{summary.repliedCount}</span>
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
