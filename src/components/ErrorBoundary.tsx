import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="bg-red-500/10 p-6 rounded-full inline-flex mb-8 border border-red-500/20">
              <AlertTriangle size={48} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Algo deu errado</h1>
            <p className="text-zinc-400 text-lg mb-2">
              Ocorreu um erro inesperado na aplicação.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-left text-sm text-red-400 mb-6 overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 mt-4"
            >
              <RefreshCw size={18} />
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
