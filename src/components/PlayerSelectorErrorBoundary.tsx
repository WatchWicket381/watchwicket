import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class PlayerSelectorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Player Selector Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleClose = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-lg w-full border-2 border-red-600">
            <div className="bg-red-900 border-b border-red-700 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">
                Couldn't open Cricket Squad
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-950 border border-red-800 rounded-lg p-4">
                <p className="font-semibold text-red-200 mb-2">Error Details:</p>
                <p className="text-red-300 text-sm font-mono break-words">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              <div className="text-slate-300 text-sm">
                <p>Something went wrong while loading the player selector.</p>
                <p className="mt-2">You can try:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                  <li>Clicking Retry to reload the picker</li>
                  <li>Closing and reopening the modal</li>
                  <li>Adding a guest player instead</li>
                  <li>Refreshing the page</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={this.handleClose}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
