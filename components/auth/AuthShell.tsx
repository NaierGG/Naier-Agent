import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-10 text-[#e5e5e5]">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_460px]">
        <section className="surface-grid relative hidden overflow-hidden rounded-[32px] border border-white/10 bg-[#111111] p-10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,170,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(0,212,170,0.08),transparent_30%)]" />
          <div className="relative space-y-8">
            <div className="inline-flex rounded-full border border-[#00d4aa]/30 bg-[#00d4aa]/10 px-4 py-1 text-xs font-medium text-[#7ef5da]">
              {eyebrow}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl font-mono text-4xl font-semibold leading-tight">
                {title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-zinc-400">
                {description}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "\uC778\uC99D",
                  value: "Supabase Auth"
                },
                {
                  label: "BYOK",
                  value: "Gemini / DART"
                },
                {
                  label: "\uBC30\uD3EC",
                  value: "Vercel Ready"
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-2 font-mono text-lg text-zinc-100">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section>{children}</section>
      </div>
    </main>
  );
}
