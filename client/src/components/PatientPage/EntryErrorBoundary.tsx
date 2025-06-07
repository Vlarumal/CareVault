import { Component, ReactNode, ErrorInfo } from 'react';
import { Entry } from '../../types';
import { Button } from '@mui/material';

interface EntryErrorBoundaryProps {
  entry: Entry;
  children: ReactNode;
}

interface EntryErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  lastGoodState: Entry | null;
}

class EntryErrorBoundary extends Component<EntryErrorBoundaryProps, EntryErrorBoundaryState> {
  state: EntryErrorBoundaryState = {
    hasError: false,
    lastGoodState: null
  };

  static getDerivedStateFromError(error: Error): Partial<EntryErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidMount(): void {
    // Save initial state as last good state
    this.saveSnapshot();
  }

  componentDidUpdate(prevProps: EntryErrorBoundaryProps): void {
    // Save snapshot when entry changes and no error
    if (this.props.entry !== prevProps.entry && !this.state.hasError) {
      this.saveSnapshot();
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('EntryErrorBoundary caught an error:', error, errorInfo, 'Last good state:', this.state.lastGoodState);
  }

  saveSnapshot = (): void => {
    this.setState({ lastGoodState: this.props.entry });
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleUndo = (): void => {
    if (this.state.lastGoodState) {
      // In a real app, we would trigger state reversion in parent component
      // For now, just log the undo action
      console.log('Undo triggered for entry:', this.props.entry.id,
                  'Reverting to:', this.state.lastGoodState);
    }
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            border: '1px solid #ff6b6b',
            padding: '10px',
            margin: '10px 0',
            background: '#fff5f5',
            borderRadius: '4px'
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          <p><strong>Failed to render entry: {this.props.entry.type}</strong></p>
          <p>Date: {this.props.entry.date}</p>
          <p>Description: {this.props.entry.description}</p>
          
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleRetry}
              aria-label="Retry rendering this entry"
            >
              Retry
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={this.handleUndo}
              aria-label="Undo changes and revert to last known good state"
              disabled={!this.state.lastGoodState}
            >
              Undo
            </Button>
          </div>
          
          {this.state.error && (
            <details style={{ marginTop: '10px' }}>
              <summary>Error Details</summary>
              <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default EntryErrorBoundary;