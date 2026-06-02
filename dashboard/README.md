# Mail Dashboard

Google Sheets 기반 메일 현황 대시보드 (Next.js 15 + NextAuth v5)

---

## STEP 0 — 컬럼 매핑

시트: `dummy mail data` (spreadsheet ID: `1zVrJhs_0sB3wSP-vpV23usjBfS7zfPeBi8oTx_jZ9qw`)

| 컬럼 (Korean) | key | type |
|---|---|---|
| 티켓ID | ticketId | freetext |
| 최근수신(KST) | receivedAt | datetime |
| 경과(일) | elapsedDays | numeric |
| 발신자 | sender | email |
| 발신자유형 | senderType | category |
| 언어 | language | category |
| 분류 | category | category (main) |
| 담당부서 | department | category |
| 중요도 | importance | numeric |
| 감정 | sentiment | category |
| SLA기한 | slaDue | datetime |
| 지연 | isDelayed | boolean ("지연"=true, ""=false) |
| 처리상태 | status | status |
| 회신여부 | replied | status |
| 검토필요 | needsReview | boolean ("검토필요"=true, ""=false) |
| AI회신초안/조치 | aiDraft | longtext |
| Gmail링크 | gmailLink | url |
| Draft상태 | draftStatus | status |

---

## 환경변수 설명

`.env.local` 파일에 아래 변수를 설정합니다:

| 변수명 | 설명 |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google 서비스 계정 JSON을 한 줄로 직렬화한 문자열 |
| `GOOGLE_SHEETS_ID` | Google Sheets 스프레드시트 ID |
| `GOOGLE_SHEET_TAB` | 읽을 시트 탭 이름 |
| `GOOGLE_CLIENT_ID` | OAuth 앱 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 앱 클라이언트 시크릿 |
| `ALLOWED_HOSTED_DOMAINS` | 허용할 도메인 목록 (쉼표 구분, 비어있으면 전체 허용) |
| `NEXTAUTH_SECRET` | NextAuth 세션 암호화 시크릿 (랜덤 문자열) |
| `NEXTAUTH_URL` | 배포 URL (로컬: http://localhost:3000) |

---

## Google 서비스 계정 설정 (한국어)

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 또는 선택
3. **API 및 서비스 > 라이브러리** 에서 **Google Sheets API** 활성화
4. **API 및 서비스 > 사용자 인증 정보** 에서 **서비스 계정 만들기** 클릭
5. 서비스 계정 이름 입력 후 생성
6. 생성된 서비스 계정 클릭 → **키 탭** → **키 추가 > 새 키 만들기 > JSON** 선택
7. 다운로드된 JSON 파일을 한 줄로 변환:
   ```bash
   cat your-key.json | tr -d '\n'
   ```
8. 변환된 문자열을 `GOOGLE_SERVICE_ACCOUNT_JSON`에 설정
9. Google Sheets 문서 열기 → **공유** → 서비스 계정 이메일 (`...@...iam.gserviceaccount.com`) 추가 (뷰어 권한)

---

## Google OAuth 설정 (한국어)

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. **API 및 서비스 > OAuth 동의 화면** 설정
   - 사용자 유형: 내부(조직) 또는 외부
   - 앱 이름, 지원 이메일 입력
3. **API 및 서비스 > 사용자 인증 정보 > OAuth 2.0 클라이언트 ID 만들기**
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI 추가:
     - 로컬: `http://localhost:3000/api/auth/callback/google`
     - 배포: `https://your-domain.com/api/auth/callback/google`
4. 클라이언트 ID와 시크릿을 `.env.local`에 설정

---

## 로컬 개발

```bash
# 의존성 설치
cd dashboard
npm install

# 환경변수 설정
cp .env.local .env.local  # 값 채워넣기

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

---

## Vercel 배포

1. [Vercel](https://vercel.com) 에서 GitHub 레포 import
2. **Settings > Environment Variables** 에서 `.env.local` 변수 모두 추가
3. `NEXTAUTH_URL`을 배포 URL로 변경 (예: `https://your-app.vercel.app`)
4. Google Cloud Console에서 OAuth 리디렉션 URI에 배포 URL 추가
5. 자동 배포 완료

---

## 기술 스택

- **Next.js 15** — App Router, Server Components
- **NextAuth v5 Beta** — Google OAuth 인증
- **Recharts** — 차트 (AreaChart, PieChart)
- **googleapis** — Google Sheets API 연동
- **TypeScript** — 전체 타입 안전성
