'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { MailRow } from '@/lib/types'
import Icon from './Icon'

interface SearchBarProps {
  rows: MailRow[]
  onSelect: (mail: MailRow) => void
}

function parseEmail(raw: string): { name: string; email: string } {
  const m = raw.match(/^(.+?)\s*<([^>]+)>$/)
  if (m) return { name: m[1].trim(), email: m[2].trim() }
  return { name: raw, email: raw }
}

const STATUS_COLOR: Record<string, string> = {
  '신규(대기)': 'var(--accent-4)',
  '조치필요': 'var(--accent-2)',
  '회신완료': 'var(--accent)',
  '자동분류': 'var(--text-mute)',
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'color-mix(in oklch, var(--accent) 30%, transparent)', color: 'var(--accent)', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function SearchBar({ rows, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 검색 결과 — sender, category, aiDraft, department, status, ticketId
  const results = useCallback(() => {
    const q = query.trim().toLowerCase()
    if (!q || q.length < 1) return []
    return rows.filter(r =>
      r.sender?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.aiDraft?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q) ||
      r.ticketId?.toLowerCase().includes(q) ||
      r.senderType?.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [rows, query])

  const hits = results()

  useEffect(() => { setActiveIdx(0) }, [query])

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || hits.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, hits.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && hits[activeIdx]) { onSelect(hits[activeIdx]); setOpen(false); setQuery('') }
    if (e.key === 'Escape') { setOpen(false); setQuery(''); inputRef.current?.blur() }
  }

  const handleSelect = (mail: MailRow) => {
    onSelect(mail)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 14px',
        borderRadius: '10px',
        border: `1px solid ${focused ? 'color-mix(in oklch, var(--accent) 50%, var(--border))' : 'var(--border)'}`,
        background: focused ? 'color-mix(in oklch, var(--accent) 4%, var(--surface))' : 'var(--surface)',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: focused ? '0 0 0 3px color-mix(in oklch, var(--accent) 10%, transparent)' : 'none',
      }}>
        <Icon name="inbox" size={14} color="var(--text-mute)" />
        <input
          ref={inputRef}
          type="text"
          placeholder="발신자, 메일 내용, 분류 검색..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setFocused(true); if (query) setOpen(true) }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            fontSize: '13px', color: 'var(--text)', outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        {query && (
          <button
            onMouseDown={e => { e.preventDefault(); setQuery(''); setOpen(false) }}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-mute)', cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex' }}
          >
            <Icon name="xCircle" size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && hits.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'linear-gradient(180deg, var(--surface) 0%, oklch(14% 0.011 250) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          zIndex: 500,
          overflow: 'hidden',
        }}>
          {/* 결과 수 */}
          <div style={{ padding: '8px 14px 4px', fontSize: '10px', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {hits.length}건 검색됨
          </div>

          {hits.map((mail, i) => {
            const { name, email } = parseEmail(mail.sender)
            const isActive = i === activeIdx
            const statusColor = STATUS_COLOR[mail.status] || 'var(--text-mute)'

            // aiDraft 미리보기: 쿼리 주변 80자
            let preview = ''
            const q = query.toLowerCase()
            const draftLower = mail.aiDraft?.toLowerCase() || ''
            const draftIdx = draftLower.indexOf(q)
            if (draftIdx !== -1) {
              const start = Math.max(0, draftIdx - 20)
              const end = Math.min(mail.aiDraft.length, draftIdx + q.length + 60)
              preview = (start > 0 ? '…' : '') + mail.aiDraft.slice(start, end) + (end < mail.aiDraft.length ? '…' : '')
            } else {
              preview = mail.aiDraft?.slice(0, 80) + (mail.aiDraft?.length > 80 ? '…' : '')
            }

            return (
              <div
                key={mail.ticketId}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  background: isActive ? 'color-mix(in oklch, var(--accent) 8%, transparent)' : 'transparent',
                  transition: 'background 0.1s',
                }}
              >
                {/* 클릭 영역 — 모달 열기 */}
                <div
                  onMouseDown={e => { e.preventDefault(); handleSelect(mail) }}
                  style={{ flex: 1, minWidth: 0, padding: '10px 14px', cursor: 'pointer' }}
                >
                  {/* Row 1: 발신자 + 상태 + 날짜 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                        {highlight(name || email, query)}
                      </span>
                      {mail.category && (
                        <span style={{
                          fontSize: '10px', padding: '1px 7px', borderRadius: '999px',
                          background: 'color-mix(in oklch, var(--accent-3) 15%, transparent)',
                          border: '1px solid color-mix(in oklch, var(--accent-3) 25%, transparent)',
                          color: 'var(--accent-3)', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          {mail.category}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {mail.status && (
                        <span style={{ fontSize: '10px', color: statusColor, fontWeight: 500 }}>{mail.status}</span>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--text-mute)', whiteSpace: 'nowrap' }}>
                        {mail.receivedAt?.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                  {/* Row 2: 내용 미리보기 */}
                  {preview && (
                    <div style={{ fontSize: '12px', color: 'var(--text-mute)', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {highlight(preview, query)}
                    </div>
                  )}
                </div>

                {/* Gmail 바로가기 아이콘 */}
                {mail.gmailLink && (
                  <a
                    href={mail.gmailLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseDown={e => e.stopPropagation()}
                    title="Gmail에서 열기"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '40px', flexShrink: 0,
                      borderLeft: '1px solid var(--border)',
                      color: 'var(--text-mute)',
                      textDecoration: 'none',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--accent)'
                      e.currentTarget.style.background = 'color-mix(in oklch, var(--accent) 10%, transparent)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--text-mute)'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Icon name="externalLink" size={13} />
                  </a>
                )}
              </div>
            )
          })}

          {/* 하단 힌트 */}
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-mute)' }}>↵ 상세 보기</span>
            <span style={{ fontSize: '10px', color: 'var(--text-mute)' }}>↑↓ 이동</span>
            <span style={{ fontSize: '10px', color: 'var(--text-mute)' }}>Esc 닫기</span>
          </div>
        </div>
      )}

      {/* 검색어 있는데 결과 없을 때 */}
      {open && query.length > 0 && hits.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '20px 14px', textAlign: 'center',
          zIndex: 500,
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-mute)' }}>"{query}" 검색 결과 없음</div>
        </div>
      )}
    </div>
  )
}
