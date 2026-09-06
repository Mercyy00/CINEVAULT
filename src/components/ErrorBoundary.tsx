import { Component, type ErrorInfo, type ReactNode } from 'react';

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
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white font-sans">
          <div className="text-6xl mb-4 animate-bounce" aria-hidden="true">
            📽️
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black mb-3 text-[#D4A853]">
            Something went wrong in the projection room.
          </h1>
          <p className="text-sm md:text-base text-gray-400 mb-6 max-w-lg">
            We encountered a temporary render issue. Try reloading or resetting the scene.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 font-mono text-xs text-left max-w-lg max-h-32 overflow-auto custom-scrollbar">
              <p className="font-bold mb-1">Error Trace:</p>
              <p>{error.message}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#D4A853] text-black font-bold rounded-xl hover:bg-yellow-400 transition-all cursor-pointer text-sm shadow-lg"
            >
              Reload App
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all cursor-pointer text-sm border border-white/10"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
