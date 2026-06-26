export default function CompanyDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-72 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-200" />
        </div>

        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>
        <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

