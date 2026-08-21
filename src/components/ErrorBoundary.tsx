import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // @ts-ignore
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
          <div className="text-6xl mb-6">📽️</div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Something went wrong in the projection room.</h1>
          <p className="text-xl text-gray-400 mb-8 max-w-lg">We encountered a critical error while trying to render this scene. Our projectionists have been notified.</p>
          <button 
            onClick={() => {
              // @ts-ignore
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-8 py-4 bg-[#D4A853] text-black font-bold rounded-xl hover:bg-yellow-500 transition-colors shadow-[0_0_30px_rgba(255,255,255,)]"
          >
            Reload App
          </button>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
