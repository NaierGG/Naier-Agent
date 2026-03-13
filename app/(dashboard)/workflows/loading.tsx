export default function WorkflowsLoading() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        <div className="h-10 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-white/10 bg-[#111111] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-64 max-w-full animate-pulse rounded bg-white/5" />
              </div>
              <div className="h-7 w-14 animate-pulse rounded-full bg-white/10" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
              <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
            </div>
            <div className="mt-6 flex gap-3">
              {Array.from({ length: 4 }).map((__, buttonIndex) => (
                <div
                  key={buttonIndex}
                  className="h-10 flex-1 animate-pulse rounded-xl bg-white/5"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
