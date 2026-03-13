import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="StockFlow Auth"
      title={
        "\uC2E4\uC2DC\uAC04 \uC8FC\uC2DD \uC790\uB3D9\uD654\uB85C \uB2E4\uC2DC \uC785\uC7A5\uD574\uBCF4\uC138\uC694."
      }
      description={
        "\uC774\uBA54\uC77C \uB610\uB294 \uAD6C\uAE00 \uB85C\uADF8\uC778\uC73C\uB85C StockFlow AI \uB300\uC2DC\uBCF4\uB4DC\uC5D0 \uC9C4\uC785\uD574 \uC6CC\uD06C\uD50C\uB85C\uC6B0\uB97C \uAD00\uB9AC\uD558\uC138\uC694."
      }
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
