'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import type { MailRow } from '@/lib/types'

interface Props { rows: MailRow[] }

function parseSenderName(sender: string): string {
  const m = sender.match(/^(.+?)\s*</)
  return m ? m[1].trim() : sender.split('@')[0]
}

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
  boxShadow: 'inset 0 1px 0 var(--border), 0 0 0 1px var(--border)',
  borderRadius: '12px',
  padding: '20px 24px',
}

const pillStyle = (color: string): React.CSSProperties => ({
  borderRadius: '999px',
  padding: '2px 10px',
  fontSize: '11px',
  background: `color-mix(in oklch, ${color} 15%, transparent)`,
  border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
  color: color,
  fontWeight: 500,
})

const sectionTitleStyle = (dot: string): React.CSSProperties => ({
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--text-mute)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '16px',
})

export default function ImportanceSection({ rows }: Props) {
  const dist = useMemo(() => {
    const map: Record<number, number> = {}
    for (let i = 1; i <= 10; i++) map[i] = 0
    rows.forEach((r) => {
      const imp = Math.round(r.importance)
      if (imp >= 1 && imp <= 10) map[imp]++
    })
    return Object.entries(map).map(([k, v]) => ({ importance: Number(k), count: v }))
  }, [rows])

  const topRows = useMemo(() =>
    rows
      .filter((r) => r.importance >= 7)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5),
    [rows]
  )

  const categoryAvg = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {}
    rows.forEach((r) => {
      if (!map[r.category]) map[r.category] = { sum: 0, count: 0 }
      map[r.category].sum += r.importance
      map[r.category].count++
    })
    return Object.entries(map)
      .map(([cat, { sum, count }]) => ({ cat, avg: sum / count }))
      .sort((a, b) => b.avg - a.avg)
  }, [rows])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Distribution Chart */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle('var(--accent-3)')}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-3)', display: 'inline-block' }} />
          중요도 분포
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dist} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="importance" tick={{ fontSize: 11, fill: 'var(--text-mute)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-mute)' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
              cursor={{ fill: 'color-mix(in oklch, var(--accent-3) 8%, transparent)' }}
            />
            <Bar dataKey="count" name="메일 수" radius={[4, 4, 0, 0]}>
              {dist.map((d) => (
                <Cell key={d.importance} fill={d.importance >= 8 ? 'var(--accent-2)' : 'var(--accent-3)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 high-importance */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle('var(--accent-2)')}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-2)', display: 'inline-block' }} />
          고중요도 메일 Top 5 (중요도 7+)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topRows.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-mute)' }}>해당 메일이 없습니다.</p>
          )}
          {topRows.map((r) => (
            <div key={r.ticketId} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px', borderRadius: '8px', background: 'var(--surface-2)',
            }}>
              <span style={{
                fontSize: '22px', fontWeight: 700, color: 'var(--accent-4)',
                minWidth: '36px', textAlign: 'center',
              }}>{r.importance}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {parseSenderName(r.sender)}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={pillStyle('var(--accent-3)')}>{r.category}</span>
                  {r.isDelayed && <span style={pillStyle('var(--accent-2)')}>⚠ SLA 초과</span>}
                </div>
              </div>
              {r.gmailLink && (
                <a href={r.gmailLink} target="_blank" rel="noreferrer" style={{
                  padding: '6px 12px', borderRadius: '6px', fontSize: '11px',
                  border: '1px solid var(--border)', color: 'var(--text-dim)',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}>
                  Gmail →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Avg importance by category */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle('var(--accent-4)')}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-4)', display: 'inline-block' }} />
          카테고리별 평균 중요도
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categoryAvg.map(({ cat, avg }) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', width: '80px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
              <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(avg / 10) * 100}%`,
                  height: '100%',
                  background: 'color-mix(in oklch, var(--accent-3) 60%, transparent)',
                  borderRadius: '4px',
                }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-mute)', width: '28px', textAlign: 'right' }}>{avg.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
