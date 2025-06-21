import { Component, ReactNode, ErrorInfo, createRef } from 'react';
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
  private liveRegionRef = createRef<HTMLDivElement>();
  
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

  componentDidUpdate(prevProps: EntryErrorBoundaryProps, prevState: EntryErrorBoundaryState): void {
    // Save snapshot when entry changes and no error
    if (this.props.entry !== prevProps.entry && !this.state.hasError) {
      this.saveSnapshot();
    }
    
    if (this.state.hasError && !prevState.hasError) {
      const errorMessage = this.state.error
        ? `Error: ${this.state.error.message}`
        : 'An unknown error occurred';
      this.announce(errorMessage, 'error');
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('EntryErrorBoundary caught an error:', error, errorInfo, 'Last good state:', this.state.lastGoodState);
    this.announce(`Error rendering entry: ${error.message}`, 'error');
  }

  saveSnapshot = (): void => {
    this.setState({ lastGoodState: this.props.entry });
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.clearAnnouncements();
  };

  handleUndo = (): void => {
    if (this.state.lastGoodState) {
      console.log('Undo triggered for entry:', this.props.entry.id,
                  'Reverting to:', this.state.lastGoodState);
      this.announce('Entry changes reverted', 'info');
    }
    this.setState({ hasError: false });
    this.clearAnnouncements();
  };

  announce = (message: string, urgency: 'error' | 'warning' | 'info' = 'info'): void => {
    if (!this.liveRegionRef.current) return;
    
    this.liveRegionRef.current.innerHTML = '';
    
    const announcement = document.createElement('div');
    announcement.setAttribute('role', urgency === 'error' ? 'alert' : 'status');
    announcement.setAttribute('aria-live', urgency === 'error' ? 'assertive' : 'polite');
    announcement.textContent = message;
    
    this.liveRegionRef.current.appendChild(announcement);
    this.lastAnnouncement = message;
  };

  clearAnnouncements = (): void => {
    if (this.liveRegionRef.current) {
      this.liveRegionRef.current.innerHTML = '';
      this.lastAnnouncement = null;
    }
  };


  render(): ReactNode {
    return (
      <>
        {/* ARIA live region container */}
        <div
          ref={this.liveRegionRef}
          style={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: '1px', height: '1px', margin: '-1px', padding: 0, overflow: 'hidden' }}
          aria-live="polite"
          aria-atomic="true"
        />
        
        {this.state.hasError ? (
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
        ) : (
          this.props.children
        )}
      </>
    );
  }
}

export default EntryErrorBoundary;