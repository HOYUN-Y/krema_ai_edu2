'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { MailRow } from '@/lib/types'

interface CategorySectionProps {
  rows: MailRow[]
}

const ACCENT_COLORS = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', 'var(--accent-4)']
const ACCENT_RAW = [
  'oklch(82% 0.18 142)',
  'oklch(72% 0.16 28)',
  'oklch(75% 0.14 250)',
  'oklch(82% 0.14 80)',
]

function countBy(rows: MailRow[], key: keyof MailRow) {
  const map: Record<string, number> = {}
  rows.forEach((r) => {
    const val = String(r[key]) || '(없음)'
    map[val] = (map[val] || 0) + 1
  })
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }))
}

function DonutSubSection({
  title,
  data,
  total,
}: {
  title: string
  data: { name: string; value: number }[]
  total: number
}) {
  return (
    <div style={{ flex: 1, minWidth: '280px' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-mute)', marginBottom: '16px' }}>
        {title}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={ACCENT_RAW[i % ACCENT_RAW.length]} opacity={0.85} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.slice(0, 6).map((item, i) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          const color = ACCENT_COLORS[i % ACCENT_COLORS.length]
          return (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-dim)',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name}
              </span>
              <div
                style={{
                  width: '80px',
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
                    width: `${pct}%`,
                    background: color,
                    borderRadius: '2px',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-mute)',
                  width: '32px',
                  textAlign: 'right',
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}
              >
                {item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CategorySection({ rows }: CategorySectionProps) {
  const categoryData = useMemo(() => countBy(rows, 'category'), [rows])
  const statusData = useMemo(() => countBy(rows, 'status'), [rows])

  return (
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
      <DonutSubSection title="분류별" data={categoryData} total={rows.length} />
      <DonutSubSection title="처리상태별" data={statusData} total={rows.length} />
    </div>
  )
}
