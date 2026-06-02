# krema_ai_edu2

Gmail 데이터를 Google Sheets로 수집하고, Next.js 시각화 대시보드로 보여주는 프로젝트입니다.  
Claude Code 기반 제작 교육 Day 2.

**라이브 URL:** https://krema-ai-edu2-bami.vercel.app

---

## 프로젝트 구조

```
krema_ai_edu2/
├── gmail_to_sheets.js        # Gmail → Sheets 수집 (키워드 필터링)
├── gmail_to_sheets_demo.js   # Gmail → Sheets 수집 (전체 메일, 데모용)
├── dashboard/                # Next.js 15 대시보드 웹앱
│   ├── src/
│   │   ├── app/              # App Router (layout, dashboard, API)
│   │   ├── components/       # UI 컴포넌트
│   │   └── lib/              # Sheets 연동, 타입
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
로그인 없이 누구나 접근 가능합니다.

### 기술 스택

- **Next.js 15** (App Router, TypeScript)
- **Recharts** (차트 시각화)
- **Google Sheets API** (서비스 계정)

### 대시보드 탭 구성

| 탭 | 내용 |
|-----|------|
| 메일 현황 | KPI 밴드 · 일별 수신 추이 · 활동 히트맵 · 요일별 패턴 |
| 중요도 분석 | 중요도 분포 · 발신자별 중요도 · 지연 현황 |
| 답장 필요 | 미회신 · 검토필요 카드 리스트 (AI 초안 포함) |
| AI 요약 | AI 회신 초안 목록 |
| 일정 추출 | 메일 내 일정 관련 항목 |
| 첨부파일 | 첨부파일 관련 메일 목록 |
| 메일 통계 | 분류별 · 상태별 도넛 차트 · 발신자 · 도메인 랭킹 |
| 채용 관리 | 채용 관련 메일 분류 |

### 주요 기능

- **전역 검색바** — 발신자, 분류, AI 초안 내용 실시간 검색 (최대 8건)
- **메일 상세 모달** — 검색 결과 클릭 시 전체 내용 + AI 초안 팝업
- **Gmail 바로가기** — 검색 결과 및 상세 모달에서 원본 메일 직접 이동
- **활동 히트맵** — 4주/8주/12주/26주 기간 선택, 화면 너비에 맞게 동적 렌더링
- **다크 테마** — oklch 색상 토큰 기반 디자인 시스템, SVG 아이콘

### 로컬 실행

```bash
cd dashboard
npm install
npm run dev
# → http://localhost:3000
```

로컬에서는 `GOOGLE_SERVICE_ACCOUNT_JSON`이 없으면 `gws` CLI로 자동 fallback합니다.

### 환경변수 (로컬)

`dashboard/.env.local` 파일:

```env
GOOGLE_SERVICE_ACCOUNT_JSON=     # 서비스계정 JSON (한 줄), 없으면 gws CLI 자동 사용
GOOGLE_SHEETS_ID=                # 스프레드시트 ID
GOOGLE_SHEET_TAB=                # 시트 탭 이름 (예: dummy mail data)
AUTH_SECRET=                     # openssl rand -base64 32
NEXTAUTH_SECRET=                 # AUTH_SECRET과 동일한 값
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
```

### Vercel 배포

**프로젝트 설정**

| 항목 | 값 |
|------|----|
| Root Directory | `dashboard` |
| Framework | Next.js |

**필수 환경변수**

| Key | Value |
|-----|-------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 서비스계정 JSON 한 줄 |
| `GOOGLE_SHEETS_ID` | 스프레드시트 ID |
| `GOOGLE_SHEET_TAB` | 시트 탭 이름 |
| `AUTH_SECRET` | openssl rand -base64 32 |
| `AUTH_URL` | https://your-domain.vercel.app |
| `NEXTAUTH_URL` | https://your-domain.vercel.app |
| `AUTH_TRUST_HOST` | true |

**서비스 계정 JSON 한 줄 변환:**

```bash
cat ~/Downloads/서비스계정파일.json | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)))"
```

---

## 라이선스

MIT
