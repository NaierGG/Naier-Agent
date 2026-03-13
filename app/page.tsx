import Link from "next/link";

export default function HomePage() {
  return (
    <main className="surface-grid flex min-h-screen items-center justify-center px-6 py-20">
      <div className="w-full max-w-4xl rounded-3xl border border-border/80 bg-card/80 p-10 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-8 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
          StockFlow AI Scaffold
        </div>
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <h1 className="font-mono text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              주식 자동화,
              <br />
              이제 말로 시작합니다
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              StockFlow AI의 기본 프로젝트 구조가 준비되었습니다. 다음 단계에서
              인증, Supabase 스키마, BYOK 설정, 워크플로우 실행 엔진을 순서대로
              붙여 나갑니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                로그인 페이지
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:text-primary"
              >
                대시보드 골격 보기
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background/60 p-6">
            <p className="mb-4 font-mono text-sm text-primary">Phase 1 Checklist</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Next.js 14 App Router 기본 구조</li>
              <li>• Tailwind + shadcn 스타일 설정</li>
              <li>• Supabase 클라이언트/서버 헬퍼</li>
              <li>• 타입 시스템 및 노드 타입 정의</li>
              <li>• API / Dashboard placeholder 라우트</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
