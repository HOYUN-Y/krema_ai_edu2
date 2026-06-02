'use client'

import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background:
            'linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, var(--accent), var(--accent-3), var(--accent-2)) border-box',
          border: '1px solid transparent',
          borderRadius: '20px',
          padding: '48px 40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: `linear-gradient(135deg, color-mix(in oklch, var(--accent) 20%, transparent), color-mix(in oklch, var(--accent-3) 20%, transparent))`,
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '24px',
          }}
        >
          📬
        </div>

        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px',
            letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}
        >
          Mail Dashboard
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-mute)',
            marginBottom: '36px',
          }}
        >
          내부 전용 · Google 계정으로 로그인
        </p>

        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--border)'
            e.currentTarget.style.borderColor = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface-2)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          Google로 로그인
        </button>
      </div>
    </div>
  )
}
