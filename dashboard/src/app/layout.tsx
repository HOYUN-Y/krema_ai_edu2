import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Mail Dashboard',
  description: '메일 현황 대시보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css"
        />
        <style>{`
          :root {
            --bg: oklch(13% 0.01 250);
            --surface: oklch(17% 0.013 250);
            --surface-2: oklch(20% 0.013 250);
            --border: oklch(26% 0.015 250);
            --accent: oklch(82% 0.18 142);
            --accent-2: oklch(72% 0.16 28);
            --accent-3: oklch(75% 0.14 250);
            --accent-4: oklch(82% 0.14 80);
            --text: oklch(96% 0 0);
            --text-dim: oklch(72% 0.008 250);
            --text-mute: oklch(52% 0.012 250);
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            background: radial-gradient(ellipse 80% 60% at 0% 0%, color-mix(in oklch, var(--accent) 8%, transparent), transparent),
                        radial-gradient(ellipse 70% 50% at 100% 100%, color-mix(in oklch, var(--accent-2) 8%, transparent), transparent),
                        var(--bg);
            color: var(--text);
            font-family: 'Pretendard Variable', 'Pretendard', sans-serif;
            -webkit-font-smoothing: antialiased;
            min-height: 100vh;
          }
          a { color: inherit; text-decoration: none; }
          button { cursor: pointer; font-family: inherit; }
          input, select { font-family: inherit; }
        `}</style>
      </head>
      <body className={geistMono.variable}>{children}</body>
    </html>
  )
}
