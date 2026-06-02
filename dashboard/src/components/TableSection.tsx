'use client'

import { useState, useMemo } from 'react'
import type { MailRow } from '@/lib/types'

interface TableSectionProps {
  rows: MailRow[]
}

type SortKey = keyof MailRow
type SortDir = 'asc' | 'desc'

const STATUS_COLORS: Record<string, string> = {
  완료: 'var(--accent)',
  진행중: 'var(--accent-3)',
  대기: 'var(--accent-4)',
  지연: 'var(--accent-2)',
  '검토필요': 'var(--accent-2)',
}

function StatusPill({ value }: { value: string }) {
  const color = STATUS_COLORS[value] || 'var(--text-mute)'
  return (
    <span
      style={{
        borderRadius: '999px',
        padding: '2px 8px',
        background: `color-mix(in oklch, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
        fontSize: '11px',
        color,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </span>
  )
}

export default function TableSection({ rows }: TableSectionProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('receivedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const allStatuses = useMemo(() => {
    const s = new Set(rows.map((r) => r.status).filter(Boolean))
    return Array.from(s)
  }, [rows])

  const filtered = useMemo(() => {
    let result = rows
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.sender.toLowerCase().includes(q) ||
          r.ticketId.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.aiDraft.toLowerCase().includes(q)
      )
    }
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter)
    }
    result = [...result].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      let cmp = 0
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv
      } else if (typeof av === 'boolean' && typeof bv === 'boolean') {
        cmp = Number(av) - Number(bv)
      } else {
        cmp = String(av).localeCompare(String(bv))
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [rows, search, statusFilter, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3 }}>↕</span>
    return <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-mute)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '12px',
    color: 'var(--text-dim)',
    borderBottom: '1px solid color-mix(in oklch, var(--border) 50%, transparent)',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="발신자, 티켓ID, 분류, AI초안 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: statusFilter ? 'var(--text)' : 'var(--text-mute)',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">전체 상태</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span
          style={{
            padding: '8px 14px',
            fontSize: '12px',
            color: 'var(--text-mute)',
            alignSelf: 'center',
          }}
        >
          {filtered.length}건
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: 'var(--surface)' }}>
              <th style={thStyle} onClick={() => handleSort('receivedAt')}>
                수신일시 <SortIcon col="receivedAt" />
              </th>
              <th style={thStyle} onClick={() => handleSort('sender')}>
                발신자 <SortIcon col="sender" />
              </th>
              <th style={thStyle} onClick={() => handleSort('category')}>
                분류 <SortIcon col="category" />
              </th>
              <th style={thStyle} onClick={() => handleSort('importance')}>
                중요도 <SortIcon col="importance" />
              </th>
              <th style={thStyle} onClick={() => handleSort('sentiment')}>
                감정 <SortIcon col="sentiment" />
              </th>
              <th style={thStyle} onClick={() => handleSort('status')}>
                처리상태 <SortIcon col="status" />
              </th>
              <th style={thStyle} onClick={() => handleSort('replied')}>
                회신여부 <SortIcon col="replied" />
              </th>
              <th style={thStyle} onClick={() => handleSort('isDelayed')}>
                지연 <SortIcon col="isDelayed" />
              </th>
              <th style={{ ...thStyle, cursor: 'default' }}>Gmail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={row.ticketId || i}
                style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--surface)'
                }}
              >
                <td style={{ ...tdStyle, fontFamily: 'var(--font-geist-mono), monospace', fontSize: '11px' }}>
                  {row.receivedAt}
                </td>
                <td style={tdStyle}>{row.sender}</td>
                <td style={tdStyle}>
                  {row.category && <StatusPill value={row.category} />}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'var(--font-geist-mono), monospace', color: row.importance >= 4 ? 'var(--accent-2)' : 'var(--text-dim)' }}>
                  {row.importance}
                </td>
                <td style={tdStyle}>
                  {row.sentiment && (
                    <span
                      style={{
                        color:
                          row.sentiment === '긍정'
                            ? 'var(--accent)'
                            : row.sentiment === '부정'
                            ? 'var(--accent-2)'
                            : 'var(--accent-3)',
                      }}
                    >
                      {row.sentiment}
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  {row.status && <StatusPill value={row.status} />}
                </td>
                <td style={tdStyle}>
                  {row.replied && <StatusPill value={row.replied} />}
                </td>
                <td style={tdStyle}>
                  {row.isDelayed && (
                    <span
                      style={{
                        color: 'var(--accent-2)',
                        fontWeight: 600,
                        fontSize: '11px',
                      }}
                    >
                      ⚠ 지연
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  {row.gmailLink && (
                    <a
                      href={row.gmailLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--accent-3)',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid color-mix(in oklch, var(--accent-3) 25%, var(--border))',
                        background: 'color-mix(in oklch, var(--accent-3) 8%, transparent)',
                        display: 'inline-block',
                      }}
                    >
                      열기
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
