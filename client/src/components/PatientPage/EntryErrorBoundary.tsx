import { Component, ReactNode, ErrorInfo } from 'react';
import { Entry } from '../../types';

interface EntryErrorBoundaryProps {
  entry: Entry;
  children: ReactNode;
}

interface EntryErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class EntryErrorBoundary extends Component<EntryErrorBoundaryProps, EntryErrorBoundaryState> {
  state: EntryErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): EntryErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('EntryErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div 
          style={{ 
            border: '1px solid #ff6b6b', 
            padding: '10px', 
            margin: '10px 0',
            background: '#fff5f5'
          }}
        >
          <p><strong>Failed to render entry.</strong></p>
          <p>{this.props.entry.description}</p>
          <button onClick={this.handleRetry}>Retry</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EntryErrorBoundary;