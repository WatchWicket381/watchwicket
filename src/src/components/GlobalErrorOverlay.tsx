import React, { Component, ReactNode } from 'react';

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  filename?: string;
  lineno?: number;
  colno?: number;
  errorType?: string;
  userAgent?: string;
  url?: string;
  isDevelopment?: boolean;
}

interface State {
  error: ErrorInfo | null;
  isVisible: boolean;
}

interface Props {
  children: ReactNode;
}

const ERROR_STORAGE_KEY = 'last_app_error_full';

export class GlobalErrorOverlay extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const lastError = this.loadLastError();

    this.state = {
      error: lastError,
      isVisible: !!lastError,
    };
  }

  componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  loadLastError = (): ErrorInfo | null => {
    try {
      const stored = localStorage.getItem(ERROR_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (parsed.timestamp > fiveMinutesAgo) {
          return parsed;
        }
        localStorage.removeItem(ERROR_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to load last error:', err);
    }
    return null;
  };

  saveError = (errorInfo: ErrorInfo) => {
    try {
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errorInfo));
    } catch (err) {
      console.error('Failed to save error:', err);
    }
  };

  handleWindowError = (event: ErrorEvent) => {
    console.error('='.repeat(80));
    console.error('GLOBAL WINDOW ERROR CAUGHT');
    console.error('='.repeat(80));
    console.error('Error Object:', event.error);
    console.error('Message:', event.message);
    console.error('Filename:', event.filename);
    console.error('Line:', event.lineno, 'Column:', event.colno);
    console.error('Stack:', event.error?.stack);
    console.error('='.repeat(80));

    const isMinifiedReactError = event.message?.includes('Minified React error');
    let enhancedMessage = event.message || 'Unknown error';

    if (isMinifiedReactError) {
      const errorCodeMatch = event.message?.match(/#(\d+)/);
      if (errorCodeMatch) {
        const errorCode = errorCodeMatch[1];
        enhancedMessage = `React Error #${errorCode}: ${event.message}\n\n` +
          `This is a MINIFIED React error. To see the full error:\n` +
          `1. Check the browser console for the full error details\n` +
          `2. Visit: https://react.dev/errors/${errorCode}\n` +
          `3. The app is running in PRODUCTION mode - see Vite config\n\n` +
          `Common Error #300: "Cannot update a component while rendering a different component"\n` +
          `This means setState is being called during render. Check the stack trace below.`;
      }
    }

    const errorInfo: ErrorInfo = {
      message: enhancedMessage,
      stack: event.error?.stack || (event.filename ? `at ${event.filename}:${event.lineno}:${event.colno}` : undefined),
      timestamp: Date.now(),
      filename: event.filename || undefined,
      lineno: event.lineno || undefined,
      colno: event.colno || undefined,
      errorType: event.error?.name || 'Error',
      userAgent: navigator.userAgent,
      url: window.location.href,
      isDevelopment: import.meta.env.DEV,
    };

    this.saveError(errorInfo);
    this.setState({ error: errorInfo, isVisible: true });

    event.preventDefault();
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('='.repeat(80));
    console.error('UNHANDLED PROMISE REJECTION');
    console.error('='.repeat(80));
    console.error('Reason:', event.reason);
    console.error('Stack:', event.reason?.stack);
    console.error('='.repeat(80));

    const errorInfo: ErrorInfo = {
      message: event.reason?.message || String(event.reason) || 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      timestamp: Date.now(),
      errorType: 'UnhandledPromiseRejection',
      userAgent: navigator.userAgent,
      url: window.location.href,
      isDevelopment: import.meta.env.DEV,
    };

    this.saveError(errorInfo);
    this.setState({ error: errorInfo, isVisible: true });

    event.preventDefault();
  };

  handleCopyError = () => {
    if (!this.state.error) return;

    const errorText = [
      'WatchWicket App Error Report',
      '=' .repeat(80),
      '',
      'Timestamp: ' + new Date(this.state.error.timestamp).toISOString(),
      'Environment: ' + (this.state.error.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'),
      'Error Type: ' + (this.state.error.errorType || 'Unknown'),
      '',
      'Error Message:',
      '-'.repeat(80),
      this.state.error.message,
      '',
      'Location:',
      '-'.repeat(80),
      this.state.error.filename ? `File: ${this.state.error.filename}` : '',
      this.state.error.lineno ? `Line: ${this.state.error.lineno}` : '',
      this.state.error.colno ? `Column: ${this.state.error.colno}` : '',
      '',
      'Stack Trace:',
      '-'.repeat(80),
      this.state.error.stack || 'No stack trace available',
      '',
      this.state.error.componentStack ? 'Component Stack:' : '',
      this.state.error.componentStack ? '-'.repeat(80) : '',
      this.state.error.componentStack || '',
      '',
      'Environment Details:',
      '-'.repeat(80),
      'User Agent: ' + (this.state.error.userAgent || navigator.userAgent),
      'URL: ' + (this.state.error.url || window.location.href),
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

  handleReload = () => {
    localStorage.removeItem(ERROR_STORAGE_KEY);
    window.location.reload();
  };

  handleClose = () => {
    localStorage.removeItem(ERROR_STORAGE_KEY);
    this.setState({ isVisible: false });
  };

  render() {
    const { error, isVisible } = this.state;

    return (
      <>
        {this.props.children}

        {isVisible && error && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[9999] p-4">
            <div className="bg-slate-800 rounded-xl max-w-3xl w-full border-2 border-red-600 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-red-900 border-b border-red-700 px-6 py-4 sticky top-0">
                <h2 className="text-2xl font-bold text-white">App Error</h2>
                <p className="text-red-200 text-sm mt-1">
                  {new Date(error.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {error.isDevelopment !== undefined && (
                  <div className={`border rounded-lg p-3 ${error.isDevelopment ? 'bg-blue-950 border-blue-800' : 'bg-yellow-950 border-yellow-800'}`}>
                    <p className={`font-semibold text-sm ${error.isDevelopment ? 'text-blue-200' : 'text-yellow-200'}`}>
                      Environment: {error.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION (errors may be minified)'}
                    </p>
                  </div>
                )}

                {error.errorType && (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <p className="text-slate-400 text-sm">Error Type: <span className="text-red-400 font-mono">{error.errorType}</span></p>
                  </div>
                )}

                <div className="bg-red-950 border border-red-800 rounded-lg p-4">
                  <p className="font-semibold text-red-200 mb-2">Error Message:</p>
                  <pre className="text-red-300 text-sm font-mono break-words select-all whitespace-pre-wrap">
                    {error.message}
                  </pre>
                </div>

                {(error.filename || error.lineno) && (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <p className="font-semibold text-slate-300 mb-2">Error Location:</p>
                    <div className="text-sm font-mono text-slate-400 space-y-1 select-all">
                      {error.filename && <p>File: {error.filename}</p>}
                      {error.lineno && <p>Line: {error.lineno}{error.colno ? `, Column: ${error.colno}` : ''}</p>}
                    </div>
                  </div>
                )}

                {error.stack && (
                  <details open className="bg-slate-900 border border-slate-700 rounded-lg">
                    <summary className="px-4 py-3 cursor-pointer font-semibold text-slate-300 hover:bg-slate-800">
                      Stack Trace (Click to expand/collapse)
                    </summary>
                    <div className="px-4 py-3 border-t border-slate-700">
                      <pre className="text-xs text-slate-400 font-mono overflow-x-auto select-all whitespace-pre-wrap break-words">
                        {error.stack}
                      </pre>
                    </div>
                  </details>
                )}

                {error.componentStack && (
                  <details open className="bg-slate-900 border border-slate-700 rounded-lg">
                    <summary className="px-4 py-3 cursor-pointer font-semibold text-slate-300 hover:bg-slate-800">
                      Component Stack (Click to expand/collapse)
                    </summary>
                    <div className="px-4 py-3 border-t border-slate-700">
                      <pre className="text-xs text-slate-400 font-mono overflow-x-auto select-all whitespace-pre-wrap break-words">
                        {error.componentStack}
                      </pre>
                    </div>
                  </details>
                )}

                <div className="text-slate-300 text-sm bg-slate-900 rounded-lg p-4">
                  <p className="font-semibold mb-2">What happened?</p>
                  <p>The app encountered an unexpected error. You can:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                    <li>Copy the error details and report it to support</li>
                    <li>Reload the app to try again</li>
                    <li>Close this overlay to continue (may be unstable)</li>
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
                  <button
                    onClick={this.handleClose}
                    className="flex-1 min-w-[140px] bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}
