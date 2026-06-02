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
    <div style={{
      flex: 1,
      minWidth: '280px',
      background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
      boxShadow: 'inset 0 1px 0 var(--border), 0 0 0 1px var(--border)',
      borderRadius: '12px',
      padding: '20px 24px',
    }}>
      <SectionLabel label={title} />
      <div style={{ position: 'relative' }}>
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
        {/* Center label */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-geist-mono), monospace', lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-mute)', marginTop: '2px' }}>건</div>
        </div>
      </div>

      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.slice(0, 8).map((item, i) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          const color = ACCENT_COLORS[i % ACCENT_COLORS.length]
          return (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </span>
              <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: color, borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-mute)', width: '28px', textAlign: 'right', fontFamily: 'var(--font-geist-mono), monospace' }}>
                {pct}%
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-mute)', width: '28px', textAlign: 'right', fontFamily: 'var(--font-geist-mono), monospace' }}>
                {item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HBarChart({
  title,
  data,
  colorVar,
}: {
  title: string
  data: { name: string; value: number; color?: string }[]
  colorVar?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const effectiveColor = colorVar || 'var(--accent-3)'

  return (
    <div style={{
      flex: 1,
      minWidth: '260px',
      background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
      boxShadow: 'inset 0 1px 0 var(--border), 0 0 0 1px var(--border)',
      borderRadius: '12px',
      padding: '20px 24px',
    }}>
      <SectionLabel label={title} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.slice(0, 8).map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          const barPct = Math.round((item.value / maxVal) * 100)
          const color = item.color || effectiveColor
          return (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '12px',
                color: 'var(--text-dim)',
                width: '120px',
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {item.name}
              </span>
              <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${barPct}%`,
                  background: `color-mix(in oklch, ${color} 70%, transparent)`,
                  borderRadius: '4px',
                }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text)', width: '40px', textAlign: 'right', fontFamily: 'var(--font-geist-mono), monospace' }}>
                {item.value}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-mute)', width: '36px', textAlign: 'right', fontFamily: 'var(--font-geist-mono), monospace' }}>
                {pct}%
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

  const departmentData = useMemo(() => countBy(rows, 'department'), [rows])

  const senderTypeData = useMemo(() => {
    const map: Record<string, number> = {}
    rows.forEach((r) => {
      const val = r.senderType || '(없음)'
      map[val] = (map[val] || 0) + 1
    })
    const colorMap: Record<string, string> = {
      '외부고객': 'var(--accent)',
      '자동': 'var(--accent-4)',
      '마케팅': 'var(--accent-4)',
      '자동/마케팅': 'var(--accent-4)',
      '내부': 'var(--accent-3)',
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
        color: colorMap[name] || 'var(--accent-3)',
      }))
  }, [rows])

  const sentimentData = useMemo(() => {
    const map: Record<string, number> = {}
    rows.forEach((r) => {
      const val = r.sentiment || '(없음)'
      map[val] = (map[val] || 0) + 1
    })
    const colorMap: Record<string, string> = {
      '긍정': 'var(--accent)',
      '중립': 'var(--accent-3)',
      '부정': 'var(--accent-2)',
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
        color: colorMap[name] || 'var(--accent-3)',
      }))
  }, [rows])

  const languageData = useMemo(() => countBy(rows, 'language'), [rows])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Row 1: Donuts */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <DonutSubSection title="분류별" data={categoryData} total={rows.length} />
        <DonutSubSection title="처리상태별" data={statusData} total={rows.length} />
      </div>

      {/* Row 2: Horizontal bars */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <HBarChart title="담당부서별" data={departmentData} colorVar="var(--accent-3)" />
        <HBarChart title="발신자유형별" data={senderTypeData} />
      </div>

      {/* Row 3: Horizontal bars */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <HBarChart title="감정별" data={sentimentData} />
        <HBarChart title="언어별" data={languageData} colorVar="var(--accent-3)" />
      </div>
    </div>
  )
}
