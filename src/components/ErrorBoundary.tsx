import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('='.repeat(80));
    console.error('REACT ERROR BOUNDARY CAUGHT ERROR');
    console.error('='.repeat(80));
    console.error('Error:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('='.repeat(80));

    this.setState({ errorInfo });

    const fullErrorReport = {
      timestamp: new Date().toISOString(),
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      isDevelopment: import.meta.env.DEV,
    };

    try {
      localStorage.setItem('last_app_error_full', JSON.stringify(fullErrorReport));
    } catch (err) {
      console.error('Failed to save error to localStorage:', err);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleCopyError = () => {
    if (!this.state.error) return;

    const errorText = [
      'WatchWicket React Error Boundary Report',
      '=' .repeat(80),
      '',
      'Timestamp: ' + new Date().toISOString(),
      'Environment: ' + (import.meta.env.DEV ? 'DEVELOPMENT' : 'PRODUCTION'),
      'Error Name: ' + (this.state.error.name || 'Unknown'),
      '',
      'Error Message:',
      '-'.repeat(80),
      this.state.error.message,
      '',
      'Stack Trace:',
      '-'.repeat(80),
      this.state.error.stack || 'No stack trace available',
      '',
      this.state.errorInfo?.componentStack ? 'Component Stack:' : '',
      this.state.errorInfo?.componentStack ? '-'.repeat(80) : '',
      this.state.errorInfo?.componentStack || '',
      '',
      'Environment Details:',
      '-'.repeat(80),
      'User Agent: ' + navigator.userAgent,
      'URL: ' + window.location.href,
      '',
      '=' .repeat(80),
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error details copied to clipboard');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = errorText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Error details copied to clipboard');
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-red-500 rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="bg-red-900 border-b border-red-700 px-6 py-4 sticky top-0">
              <h2 className="text-2xl font-bold text-white">React Error Boundary</h2>
              <p className="text-red-200 text-sm mt-1">
                Component rendering error caught
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className={`border rounded-lg p-3 ${import.meta.env.DEV ? 'bg-blue-950 border-blue-800' : 'bg-yellow-950 border-yellow-800'}`}>
                <p className={`font-semibold text-sm ${import.meta.env.DEV ? 'text-blue-200' : 'text-yellow-200'}`}>
                  Environment: {import.meta.env.DEV ? 'DEVELOPMENT' : 'PRODUCTION (errors may be minified)'}
                </p>
              </div>

              {this.state.error && (
                <>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <p className="text-slate-400 text-sm">
                      Error Type: <span className="text-red-400 font-mono">{this.state.error.name || 'Error'}</span>
                    </p>
                  </div>

                  <div className="bg-red-950 border border-red-800 rounded-lg p-4">
                    <p className="font-semibold text-red-200 mb-2">Error Message:</p>
                    <pre className="text-red-300 text-sm font-mono break-words select-all whitespace-pre-wrap">
                      {this.state.error.message}
                    </pre>
                  </div>

                  {this.state.error.stack && (
                    <details open className="bg-slate-900 border border-slate-700 rounded-lg">
                      <summary className="px-4 py-3 cursor-pointer font-semibold text-slate-300 hover:bg-slate-800">
                        Stack Trace (Click to expand/collapse)
                      </summary>
                      <div className="px-4 py-3 border-t border-slate-700">
                        <pre className="text-xs text-slate-400 font-mono overflow-x-auto select-all whitespace-pre-wrap break-words">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    </details>
                  )}
                </>
              )}

              {this.state.errorInfo?.componentStack && (
                <details open className="bg-slate-900 border border-slate-700 rounded-lg">
                  <summary className="px-4 py-3 cursor-pointer font-semibold text-slate-300 hover:bg-slate-800">
                    React Component Stack (Click to expand/collapse)
                  </summary>
                  <div className="px-4 py-3 border-t border-slate-700">
                    <pre className="text-xs text-slate-400 font-mono overflow-x-auto select-all whitespace-pre-wrap break-words">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="text-slate-300 text-sm bg-slate-900 rounded-lg p-4">
                <p className="font-semibold mb-2">What happened?</p>
                <p>React caught an error during component rendering. You can:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                  <li>Copy the error details and report it to support</li>
                  <li>Check the browser console for more details</li>
                  <li>Reload the app to try again</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={this.handleCopyError}
                  className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                >
                  Copy Error
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                >
                  Reload App
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

export default ErrorBoundary;
