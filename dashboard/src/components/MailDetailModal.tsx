'use client'

import { useEffect } from 'react'
import type { MailRow } from '@/lib/types'
import Icon from './Icon'

interface MailDetailModalProps {
  mail: MailRow
  onClose: () => void
}

function parseEmail(raw: string): { name: string; email: string } {
  const m = raw.match(/^(.+?)\s*<([^>]+)>$/)
  if (m) return { name: m[1].trim(), email: m[2].trim() }
  return { name: raw, email: raw }
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 500,
      background: `color-mix(in oklch, ${color} 15%, transparent)`,
      border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
      color,
    }}>
      {label}
    </span>
  )
}

const SENTIMENT_COLOR: Record<string, string> = {
  긍정: 'var(--accent)',
  중립: 'var(--accent-3)',
  부정: 'var(--accent-2)',
}

const STATUS_COLOR: Record<string, string> = {
  '신규(대기)': 'var(--accent-4)',
  '조치필요': 'var(--accent-2)',
  '회신완료': 'var(--accent)',
  '자동분류': 'var(--text-mute)',
}

export default function MailDetailModal({ mail, onClose }: MailDetailModalProps) {
  const { name, email } = parseEmail(mail.sender)

  // ESC로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(680px, calc(100vw - 48px))',
        maxHeight: 'calc(100vh - 80px)',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, var(--surface) 0%, oklch(14% 0.011 250) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        zIndex: 1001,
        padding: '28px',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
            {/* Sender */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: 'var(--bg)',
              }}>
                {(name || email).slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name || email}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-mute)' }}>{email}</div>
              </div>
            </div>
            {/* Date + elapsed */}
            <div style={{ fontSize: '11px', color: 'var(--text-mute)' }}>
              {mail.receivedAt}
              {mail.elapsedDays > 0 && <span style={{ marginLeft: '8px', color: mail.isDelayed ? 'var(--accent-2)' : 'var(--text-mute)' }}>· {mail.elapsedDays}일 경과</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-mute)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="xCircle" size={14} />
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {mail.category && <Pill label={mail.category} color="var(--accent-3)" />}
          {mail.department && <Pill label={mail.department} color="var(--text-dim)" />}
          {mail.status && <Pill label={mail.status} color={STATUS_COLOR[mail.status] || 'var(--text-dim)'} />}
          {mail.sentiment && <Pill label={mail.sentiment} color={SENTIMENT_COLOR[mail.sentiment] || 'var(--text-dim)'} />}
          {mail.isDelayed && (
            <Pill label="SLA 초과" color="var(--accent-2)" />
          )}
          {mail.needsReview && <Pill label="검토 필요" color="var(--accent-4)" />}
        </div>

        {/* Meta row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px',
          background: 'var(--border)', borderRadius: '10px', overflow: 'hidden',
          marginBottom: '20px',
        }}>
          {[
            { label: '중요도', value: `${mail.importance} / 10` },
            { label: '언어', value: mail.language || '—' },
            { label: 'Draft 상태', value: mail.draftStatus || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--surface)', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--font-geist-mono), monospace', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* SLA */}
        {mail.slaDue && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', borderRadius: '8px', marginBottom: '20px',
            background: mail.isDelayed
              ? 'color-mix(in oklch, var(--accent-2) 8%, transparent)'
              : 'color-mix(in oklch, var(--accent-4) 8%, transparent)',
            border: `1px solid color-mix(in oklch, ${mail.isDelayed ? 'var(--accent-2)' : 'var(--accent-4)'} 25%, transparent)`,
          }}>
            <Icon name="clock" size={13} color={mail.isDelayed ? 'var(--accent-2)' : 'var(--accent-4)'} />
            <span style={{ fontSize: '12px', color: mail.isDelayed ? 'var(--accent-2)' : 'var(--accent-4)' }}>
              SLA 기한: {mail.slaDue}
            </span>
          </div>
        )}

        {/* AI Draft */}
        {mail.aiDraft && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-mute)', fontWeight: 500 }}>
                AI 회신 초안 / 조치
              </span>
            </div>
            <div style={{
              padding: '16px 18px',
              borderRadius: '10px',
              background: 'var(--surface)',
              borderLeft: '3px solid var(--accent)',
              fontSize: '13px',
              lineHeight: '1.75',
              color: 'var(--text-dim)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {mail.aiDraft}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-mute)' }}>ID: {mail.ticketId}</span>
          {mail.gmailLink && (
            <a
              href={mail.gmailLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-dim)',
                fontSize: '12px', fontWeight: 500,
                textDecoration: 'none',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'color-mix(in oklch, var(--accent) 40%, var(--border))'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-dim)'
              }}
            >
              <Icon name="externalLink" size={13} />
              Gmail에서 열기
            </a>
          )}
        </div>
      </div>
    </>
  )
}
