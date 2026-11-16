import React, { Component } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Reusable React Error Boundary component.
 *
 * Catches uncaught JavaScript errors in child component trees, logs the errors,
 * and renders a resilient fallback UI instead of crashing the entire application into a blank screen.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the actual error and component stack to the console
    console.error('[ErrorBoundary caught an uncaught component error]:', error, errorInfo);
    this.setState({ errorInfo });

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (logErr) {
        console.error('[ErrorBoundary] Error during onError callback:', logErr);
      }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (typeof fallback === 'function') {
        return fallback({
          error,
          errorInfo,
          resetError: this.handleReset,
          reload: this.handleReload,
        });
      }

      if (fallback) {
        return fallback;
      }

      // Default resilient fallback UI
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-6 shadow-xl dark:border-rose-900/60 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 rounded bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 mb-1">
                  Resilience Safeguard Active
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Application Rendering Error
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  An unexpected rendering error occurred. The application error boundary prevented a blank screen crash.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 text-xs font-mono text-rose-800 dark:border-rose-950/60 dark:bg-rose-950/40 dark:text-rose-300 break-words">
              {error?.name ? `${error.name}: ` : ''}
              {error?.message || 'Unknown component rendering error'}
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try to Recover
              </button>
            </div>

            {/* Expandable Technical Trace */}
            {(error?.stack || errorInfo?.componentStack) && (
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <span>{showDetails ? 'Hide technical trace' : 'View technical error trace'}</span>
                  {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {showDetails && (
                  <pre className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-slate-900 p-3 text-[11px] text-slate-300 font-mono whitespace-pre-wrap dark:bg-slate-950">
                    {error?.stack || errorInfo?.componentStack || 'No stack trace available'}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

