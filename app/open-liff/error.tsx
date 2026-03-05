"use client";

export default function OpenLiffError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-red-700">Open LINE error</h1>
        <p className="mt-2 text-sm text-slate-700">
          Unable to continue automatically. Please retry.
        </p>
        <p className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
          {error?.message || "Unknown error"}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
