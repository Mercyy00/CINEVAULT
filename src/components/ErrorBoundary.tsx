import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
  /**
   * Renders instead of the full-screen fallback. Route-level boundaries use it
   * so a crash inside one page keeps the navbar, overlays and toasts alive
   * rather than replacing the entire application with an error screen.
   */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /**
   * Changing this value clears a caught error. The route boundary passes the
   * current route, so navigating away from a broken page recovers by itself --
   * without it, React keeps the fallback mounted forever and the only way out
   * is a reload.
   */
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in CineVault:', error, errorInfo);
  }

  public override componentDidUpdate(previous: Props) {
    if (this.state.hasError && previous.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  private reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public override render() {
    const { error, hasError } = this.state;

    if (hasError) {
      if (this.props.fallback) {
        return this.props.fallback(error ?? new Error('Unknown render error'), this.reset);
      }

      return (
        <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center p-6 text-center text-foreground font-sans select-none">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-brand/20 filter blur-2xl -z-10" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-card border border-brand/30 flex items-center justify-center shadow-xl shadow-brand/10 backdrop-blur-xl">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-brand stroke-[1.75]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3 tracking-tight">
            Unable to Load Application
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md leading-relaxed">
            An unexpected error occurred while loading CineVault. Please refresh the page to restore your session.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-brand text-background font-bold rounded-full hover:brightness-110 transition-all cursor-pointer text-sm shadow-lg shadow-brand/20 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload App</span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="flex items-center gap-2 px-6 py-3 bg-card hover:bg-white/10 text-foreground font-semibold rounded-full transition-all cursor-pointer text-sm border border-white/10 active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
