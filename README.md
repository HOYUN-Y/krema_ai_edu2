# krema_ai_edu2

Gmail 데이터를 Google Sheets로 수집하고, 시각화 대시보드로 보여주는 프로젝트입니다.  
Claude Code 기반 제작 교육 Day 2.

---

## 프로젝트 구조

```
krema_ai_edu2/
├── gmail_to_sheets.js        # Gmail → Sheets 수집 (키워드 필터링)
├── gmail_to_sheets_demo.js   # Gmail → Sheets 수집 (전체 메일, 데모용)
├── dashboard/                # Next.js 15 대시보드 웹앱
│   ├── src/
│   │   ├── app/              # App Router (layout, login, dashboard, API)
│   │   ├── components/       # UI 컴포넌트
│   │   └── lib/              # Sheets 연동, 인증, 타입
│   ├── .env.local            # 환경변수 (git 제외)
│   └── README.md             # 대시보드 상세 가이드
└── README.md                 # 이 파일
```

---

## 1. Gmail → Sheets 수집 스크립트

### 설치

```bash
npm install
```

### 사용법

```bash
# 전체 메일 수집 (데모)
node gmail_to_sheets_demo.js

# 키워드 필터링 수집
node gmail_to_sheets.js
```

`gws` CLI를 통해 Gmail/Sheets API에 접근합니다. 사전에 `gws` 인증이 완료되어 있어야 합니다.

### 수집 결과 컬럼

| 컬럼 | 설명 |
|------|------|
| 티켓ID | Gmail 스레드 ID |
| 최근수신(KST) | 수신 일시 (KST) |
| 경과(일) | 수신 후 경과 일수 |
| 발신자 | 발신자 이름 + 이메일 |
| 발신자유형 | 외부고객 / 자동/마케팅 / 내부 |
| 언어 | KO / EN / ZH 등 |
| 분류 | 협업/제휴, 교육/강연, 계약/서명 등 |
| 담당부서 | 자동 분류된 처리 부서 |
| 중요도 | 1~10 점수 |
| 감정 | 긍정 / 중립 / 부정 |
| SLA기한 | 처리 기한 |
| 지연 | SLA 초과 여부 |
| 처리상태 | 신규(대기) / 조치필요 / 회신완료 / 자동분류 |
| 회신여부 | 미회신 / 회신완료 |
| 검토필요 | 수동 검토 필요 여부 |
| AI회신초안/조치 | AI가 생성한 회신 초안 또는 조치 안내 |
| Gmail링크 | 원본 메일 바로가기 |
| Draft상태 | Gmail Draft 생성 상태 |

---

## 2. Mail Dashboard (Next.js 웹앱)

Google Sheets 데이터를 시각화하는 읽기 전용 대시보드입니다.

### 기술 스택

- **Next.js 15** (App Router, TypeScript)
- **NextAuth v5** (Google OAuth)
- **Recharts** (차트)
- **Google Sheets API** (서비스계정 또는 gws CLI)

### 시각화 섹션

| 섹션 | 내용 |
|------|------|
| KPI 밴드 | 총 티켓 · 미회신 · 지연 건수 · 평균 중요도 |
| 타임라인 | 일별 스파크라인 + 8주 활동 히트맵 |
| 카테고리 | 분류별 / 처리상태별 도넛 차트 |
| 발신자 | Top 10 발신자 · Top 5 도메인 랭킹 |
| 검토 뷰 | 미회신 · 검토필요 카드 리스트 (AI 초안 포함) |
| 전체 테이블 | 검색 · 필터 · 정렬 · Gmail 링크 |

### 로컬 실행

```bash
cd dashboard
npm install
npm run dev
# → http://localhost:3000
```

### 환경변수

`dashboard/.env.local` 파일에 아래 값을 입력합니다.

```env
GOOGLE_SERVICE_ACCOUNT_JSON=     # 서비스계정 JSON (한 줄), 없으면 gws CLI 자동 사용
GOOGLE_SHEETS_ID=                # 스프레드시트 ID
GOOGLE_SHEET_TAB=                # 시트 탭 이름
GOOGLE_CLIENT_ID=                # GCP OAuth 클라이언트 ID
GOOGLE_CLIENT_SECRET=            # GCP OAuth 클라이언트 Secret
ALLOWED_HOSTED_DOMAINS=          # 허용 도메인 (비우면 전체 허용)
NEXTAUTH_SECRET=                 # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
```

### Google OAuth 설정

1. [GCP 콘솔](https://console.cloud.google.com) → API 및 서비스 → 사용자 인증 정보
2. OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
3. 승인된 JavaScript 원본: `http://localhost:3000`
4. 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`
5. OAuth 동의 화면 → 테스트 사용자에 본인 계정 추가

### 서비스계정 미설정 시 (로컬 개발)

`GOOGLE_SERVICE_ACCOUNT_JSON`이 없으면 로컬에 설치된 `gws` CLI로 자동 fallback합니다.  
`gws` 인증이 완료된 환경에서는 별도 서비스계정 없이도 동작합니다.

---

## 라이선스

MIT
