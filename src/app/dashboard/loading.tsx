export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-56 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-80 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 h-10 animate-pulse rounded bg-slate-100" />
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
