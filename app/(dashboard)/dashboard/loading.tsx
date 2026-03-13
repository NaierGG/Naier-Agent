export default function DashboardLoading() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        <div className="h-10 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-white/10 bg-[#111111] p-6"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-10 w-20 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-4 w-32 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="rounded-3xl border border-white/10 bg-[#111111] p-6">
          <div className="h-6 w-36 animate-pulse rounded bg-white/10" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#111111] p-6">
          <div className="h-6 w-28 animate-pulse rounded bg-white/10" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
