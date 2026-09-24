"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorPageProps) {
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            An unexpected issue occurred while loading this page. This has been noted.
          </p>
          {error?.digest && (
            <p className="text-[11px] font-mono text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg inline-block">
              Ref: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
            aria-label="Try loading the page again"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
            aria-label="Go back to the dashboard"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        {/* Legal disclaimer reminder */}
        <p className="text-[10px] text-slate-600 font-mono">
          LegalLens provides document navigation assistance — not legal advice.
        </p>
      </div>
    </div>
  );
}
