import React, { Component, ReactNode } from 'react';

/**
 * ErrorBoundary component - Catches JavaScript errors in child components
 * @component
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render
 * @param {ReactNode} [props.fallback] - Custom fallback UI when error occurs
 * @example
 * <ErrorBoundary fallback={<ErrorScreen />}>
 *   <App />
 * </ErrorBoundary>
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div role="alert">
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message}</p>
          <button onClick={this.handleRetry}>Retry</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
