import React, { Component, ReactNode } from 'react';

/**
 * ErrorBoundary component - Catches JavaScript errors in child components
 * @component
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render
 * @param {ReactNode} [props.fallback] - Custom fallback UI when error occurs
 * @param {Function} [props.onError] - Callback for error logging
 * @example
 * <ErrorBoundary
 *   fallback={<ErrorScreen />}
 *   onError={(error, errorInfo) => logError(error, errorInfo)}
 * >
 *   <App />
 * </ErrorBoundary>
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReport = (): void => {
    const { error, errorInfo } = this.state;
    if (error) {
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack
      };
      alert(`Error reported:\n${JSON.stringify(errorDetails, null, 2)}`);
      // In a real app, this would send to an error tracking service
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div role="alert" style={{ padding: '20px', border: '1px solid #f0c0c0', background: '#fff0f0' }}>
          <h3>Something went wrong</h3>
          <p><strong>Error:</strong> {this.state.error?.message}</p>
          
          {process.env.NODE_ENV === 'development' && this.state.errorInfo?.componentStack && (
            <details style={{ marginTop: '10px' }}>
              <summary>Error details</summary>
              <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={this.handleRetry}>Retry</button>
            <button onClick={this.handleReport}>Report Error</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
