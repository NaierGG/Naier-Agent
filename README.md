# StockFlow AI

한국 개인투자자를 위한 주식 자동화 AI 에이전트 빌더입니다. 자연어와 워크플로우 UI로 자동화를 만들고, 본인 API 키(BYOK)로 실행하도록 설계되어 있습니다.

## 1. 프로젝트 소개

- Next.js 14 App Router 기반 SaaS
- Supabase Auth + PostgreSQL + RLS
- Gemini 기반 워크플로우 생성
- 사용자 API 키 직접 사용(BYOK)
- Netlify 배포 + Scheduled Function 기반 주기 실행

## 2. 로컬 개발 환경 세팅

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

## 3. Supabase 프로젝트 생성 + 마이그레이션 실행

1. Supabase에서 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 아래 값을 확인합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. 루트의 `.env.local`에 값을 채웁니다.
4. [supabase/migrations/001_initial_schema.sql](C:/Users/KANG%20HEE/OneDrive/%EC%BD%94%EB%94%A9/AI%20Agent/supabase/migrations/001_initial_schema.sql) 내용을 Supabase SQL Editor에서 실행합니다.
5. Auth에서 Email 로그인과 Google OAuth를 활성화합니다.
6. Redirect URL에 로컬 주소와 배포 주소를 등록합니다.
   - `http://localhost:3000/api/auth/callback`
   - `https://your-netlify-site.netlify.app/api/auth/callback`

## 4. Netlify 배포 방법

1. GitHub 저장소를 Netlify에 Import 합니다.
2. Framework는 Next.js로 자동 감지되도록 둡니다.
3. 배포 설정은 아래처럼 둡니다.
   - Build command: `npm run build`
   - Publish directory: `.next`
4. 환경변수를 Netlify Site settings > Environment variables에 등록합니다.
5. 배포 후 실제 사이트 주소를 `NEXT_PUBLIC_APP_URL` 값과 Supabase Redirect URL에 반영합니다.
6. Scheduled Function은 [netlify/functions/cron-run.ts](C:/Users/KANG%20HEE/OneDrive/%EC%BD%94%EB%94%A9/AI%20Agent/netlify/functions/cron-run.ts)와 [netlify.toml](C:/Users/KANG%20HEE/OneDrive/%EC%BD%94%EB%94%A9/AI%20Agent/netlify.toml)을 통해 매분 실행되도록 설정되어 있습니다.

## 5. 환경변수 설정 가이드

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
CRON_SECRET=generate-random-string-here
```

주의:
- AI API 키는 서버 환경변수에 넣지 않습니다.
- Gemini, DART, Telegram, Discord, SMTP 정보는 각 사용자가 설정 화면에서 직접 입력합니다.
- `CRON_SECRET`은 Netlify Scheduled Function보다 외부 수동 호출용 `/api/cron/run` 보호에 주로 사용됩니다.

## 6. 첫 워크플로우 만들기 가이드

1. 회원가입 후 로그인합니다.
2. [settings](C:/Users/KANG%20HEE/OneDrive/%EC%BD%94%EB%94%A9/AI%20Agent/app/(dashboard)/settings/page.tsx)에서 Gemini API 키를 등록합니다.
3. 대시보드에서 `새 워크플로우`를 클릭합니다.
4. 예를 들어 아래처럼 요청합니다.

```text
삼성전자 뉴스 매일 아침 9시에 텔레그램으로 보내줘
```

5. 생성된 노드 흐름을 확인하고 저장합니다.
6. 워크플로우 목록에서 활성화하거나 수동 실행으로 테스트합니다.

## 참고

- 파일 업로드용 Supabase Storage 설정은 현재 프로젝트에서 필요하지 않습니다.
- 수동 또는 외부 호출이 필요하면 [app/api/cron/run/route.ts](C:/Users/KANG%20HEE/OneDrive/%EC%BD%94%EB%94%A9/AI%20Agent/app/api/cron/run/route.ts)를 사용할 수 있습니다.
- Netlify 배포 핵심 설정은 [netlify.toml](C:/Users/KANG%20HEE/OneDrive/%EC%BD%94%EB%94%A9/AI%20Agent/netlify.toml)에 있습니다.
