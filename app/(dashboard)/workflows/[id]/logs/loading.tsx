export default function WorkflowLogsLoading() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
        <div className="h-10 w-72 max-w-full animate-pulse rounded bg-white/10" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-white/10 bg-[#111111] p-4">
          <div className="h-6 w-28 animate-pulse rounded bg-white/10" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111111] p-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
