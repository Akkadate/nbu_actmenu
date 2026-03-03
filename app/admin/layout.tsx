import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/admin" className="text-sm font-semibold tracking-wide text-slate-900">
            NBU ActMenu Admin
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100">
              Activities
            </Link>
            <Link
              href="/admin/activity"
              className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
            >
              Create
            </Link>
            <Link
              href="/admin/manual"
              className="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800"
            >
              Manual
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}