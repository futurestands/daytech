import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isQuotaError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '', isQuotaError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const raw = error?.message || 'An unexpected application error occurred.';
    let friendly = raw;
    let isQuotaError = raw.toLowerCase().includes('quota exceeded');

    try {
      const parsed = JSON.parse(raw) as { error?: string; operationType?: string; path?: string };
      if (parsed && typeof parsed.error === 'string') {
        isQuotaError = parsed.error.toLowerCase().includes('quota exceeded');
        friendly = parsed.error;
      }
    } catch {
      // plain string error
    }

    return {
      hasError: true,
      message: friendly,
      isQuotaError,
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#020617] px-4">
          <div className="max-w-lg w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-7 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="font-display text-xl font-bold text-[#0B1120] dark:text-white">
                {this.state.isQuotaError ? 'Firestore Daily Quota Reached' : 'Application Error'}
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {this.state.isQuotaError
                ? 'The project Firestore free-tier daily quota has been exceeded. Quotas reset daily; please try again later or review the Spark plan limits in the Firebase Console.'
                : this.state.message}
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <a
                href="/"
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold text-[#0B1120] dark:text-white"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
