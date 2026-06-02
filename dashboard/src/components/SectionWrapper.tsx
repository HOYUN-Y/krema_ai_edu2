'use client'

import { useState, useRef, useEffect } from 'react'

interface SectionWrapperProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  expanded?: boolean
  onToggle?: () => void
}

export default function SectionWrapper({
  title,
  children,
  defaultOpen = true,
  expanded,
  onToggle,
}: SectionWrapperProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')

  const isOpen = expanded !== undefined ? expanded : localOpen

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setLocalOpen((v) => !v)
    }
  }

  return (
    <div
      style={{
        marginBottom: '24px',
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'none',
          border: 'none',
          color: 'var(--text)',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-mute)',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'inline-block',
            }}
          />
          {title}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--text-mute)',
          }}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        style={{
          height: height === 'auto' ? 'auto' : `${height}px`,
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}
      >
        <div ref={contentRef} style={{ padding: '0 24px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
