import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl font-bold">
          NM
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Nusa Media
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Production Work Status & Media Task Tracking System for Chairman, Conveners & Members.
        </p>
        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary-600 transition-all duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
