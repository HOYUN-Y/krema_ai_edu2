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
  // Try Korean format: 2024-01-15 14:30 etc.
  const m = s.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return null
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

    // Build 8-week heatmap
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

  const maxCount = Math.max(...heatmapData.map((c) => c.count), 1)

  const days = ['일', '월', '화', '수', '목', '금', '토']

  // Group into weeks
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
          {/* Day labels */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              paddingTop: '2px',
            }}
          >
            {days.map((d) => (
              <div
                key={d}
                style={{
                  fontSize: '9px',
                  color: 'var(--text-mute)',
                  height: '16px',
                  lineHeight: '16px',
                  width: '12px',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div style={{ display: 'flex', gap: '3px', flex: 1, flexWrap: 'wrap' }}>
            {weeks.map((w, wi) => (
              <div
                key={wi}
                style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}
              >
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
    </div>
  )
}
