import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Naier Auth"
      title="워크플로우와 AI 에이전트 작업공간으로 다시 들어오세요."
      description="이메일 또는 구글 로그인으로 Naier 대시보드에 진입해 자동화와 에이전트를 관리하세요."
    >
      <Suspense
        fallback={
          <div className="rounded-3xl border border-white/10 bg-[#111111] p-8">
            <div className="h-8 w-28 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-4 w-72 max-w-full animate-pulse rounded bg-white/5" />
            <div className="mt-8 space-y-4">
              <div className="h-12 animate-pulse rounded-xl bg-white/5" />
              <div className="h-12 animate-pulse rounded-xl bg-white/5" />
              <div className="h-11 animate-pulse rounded-xl bg-white/10" />
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
