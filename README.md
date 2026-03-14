# Naier

Naier는 `워크플로우 자동화 + AI 에이전트 빌더`를 목표로 하는 Next.js 기반 SaaS입니다.  
대화로 초안을 만들고, 비주얼 노드 편집기에서 다듬고, 웹훅/HTTP/API/AI/메시징 액션을 하나의 흐름으로 실행할 수 있도록 설계되어 있습니다.

## 핵심 개념

- Next.js 14 App Router 기반 SaaS
- Supabase Auth + PostgreSQL + RLS
- Gemini 기반 워크플로우 생성 및 AI 노드 실행
- BYOK 구조로 사용자 키 직접 사용
- Netlify 배포 + Scheduled Function 기반 주기 실행
- 비주얼 워크플로우 편집기 + 단일 노드 테스트

## 현재 지원 노드

- 트리거: 스케줄, 수동 실행, 웹훅
- 범용: HTTP 요청, 템플릿 변환, 조건 분기, 지연
- AI: AI Agent Task, AI 요약/분석
- 액션: 텔레그램, 디스코드, 이메일
- 특화 데이터 소스: DART 공시, 네이버 주식 뉴스, 국내 주가 조회

## 로컬 개발 환경 세팅

1. Node.js 18 이상을 설치합니다.
2. 저장소를 클론합니다.
3. 의존성을 설치합니다.

```bash
npm install
```

4. 환경변수 파일을 준비합니다.

```bash
cp .env.example .env.local
```

5. 개발 서버를 실행합니다.

```bash
npm run dev
```

## 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
CRON_SECRET=generate-random-string-here
```

주의:

- AI API 키는 서버 환경변수에 넣지 않습니다.
- Gemini, Telegram, Discord, SMTP, DART 키는 각 사용자가 설정 화면에서 직접 입력합니다.

## Supabase 설정

1. Supabase에서 새 프로젝트를 생성합니다.
2. 아래 값을 확인합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. `.env.local`에 값을 채웁니다.
4. [supabase/migrations/001_initial_schema.sql](C:/Users/KANG%20HEE/OneDrive/%EC%BD%94%EB%94%A9/AI%20Agent/supabase/migrations/001_initial_schema.sql)을 SQL Editor에서 실행합니다.
5. Auth에서 Email 로그인과 Google OAuth를 활성화합니다.
6. Redirect URL을 등록합니다.
   - `http://localhost:3000/api/auth/callback`
   - `https://your-netlify-site.netlify.app/api/auth/callback`

## Netlify 배포

1. GitHub 저장소를 Netlify에 Import 합니다.
2. 빌드 설정은 아래처럼 둡니다.
   - Build command: `npm run build`
   - Publish directory: `.next`
3. 환경변수를 등록합니다.
4. 실제 배포 주소를 `NEXT_PUBLIC_APP_URL`과 Supabase Redirect URL에 반영합니다.
5. Scheduled Function은 [netlify/functions/cron-run.ts](C:/Users/KANG%20HEE/OneDrive/%EC%BD%94%EB%94%A9/AI%20Agent/netlify/functions/cron-run.ts)와 [netlify.toml](C:/Users/KANG%20HEE/OneDrive/%EC%BD%94%EB%94%A9/AI%20Agent/netlify.toml)로 설정되어 있습니다.

## 첫 워크플로우 만들기

1. 회원가입 후 로그인합니다.
2. [settings](C:/Users/KANG%20HEE/OneDrive/%EC%BD%94%EB%94%A9/AI%20Agent/app/(dashboard)/settings/page.tsx)에서 Gemini API 키를 등록합니다.
3. `/workflows/new`에서 AI와 대화해 초안을 생성합니다.
4. 예시로 이런 요청을 사용할 수 있습니다.

```text
매일 오전 9시에 운영 현황 API를 불러와서 이메일로 보내줘
```

```text
웹훅으로 들어오는 요청을 검증해서 디스코드에 알려줘
```

```text
외부 API 응답을 AI가 요약해서 텔레그램으로 보내줘
```

5. 생성된 워크플로우를 저장한 뒤 `/workflows/[id]`에서 노드 배치와 연결을 수정합니다.
6. 단일 노드 테스트와 전체 실행으로 동작을 검증합니다.

## 다음 확장 방향

- 조건 분기용 `true/false` 엣지 타입
- Upstash Redis 기반 실행 큐
- 범용 커스텀 노드 SDK
- 팀/조직 단위 워크스페이스
- 더 강한 에이전트 메모리와 툴 호출
