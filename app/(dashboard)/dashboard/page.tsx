export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-mono text-3xl font-semibold">대시보드</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          최근 워크플로우와 실행 통계가 여기에 표시됩니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["활성 워크플로우", "오늘 실행", "성공률", "마지막 실행"].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground"
          >
            <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Placeholder
            </div>
            <p className="text-base text-foreground">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
