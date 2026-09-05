import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = { hasError: false };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in CineVault:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white font-sans">
          <div className="text-6xl mb-4 animate-bounce">📽️</div>
          <h1 className="text-3xl md:text-5xl font-display font-black mb-3 text-[#D4A853]">
            Something went wrong in the projection room.
          </h1>
          <p className="text-sm md:text-base text-gray-400 mb-6 max-w-lg">
            We encountered a temporary render issue. Try reloading or resetting the scene.
          </p>

          {this.state.error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 font-mono text-xs text-left max-w-lg max-h-32 overflow-auto custom-scrollbar">
              <p className="font-bold mb-1">Error Trace:</p>
              <p>{this.state.error.message}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-3 bg-[#D4A853] text-black font-bold rounded-xl hover:bg-yellow-400 transition-all cursor-pointer text-sm shadow-lg"
            >
              Reload App
            </button>
            <button 
              onClick={() => {
                this.setState({ hasError: false });
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
