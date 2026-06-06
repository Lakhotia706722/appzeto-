import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mb-4">
            <span className="text-[var(--danger)] text-xl">!</span>
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            className="text-sm text-[var(--accent)] hover:underline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
