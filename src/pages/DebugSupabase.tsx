import React from 'react';
import { supabase } from '../supabaseClient';

export default function DebugSupabase() {
  const [connectionTest, setConnectionTest] = React.useState<{
    status: 'pending' | 'success' | 'error';
    message: string;
  }>({ status: 'pending', message: 'Testing connection...' });

  React.useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(0);
        if (error) {
          setConnectionTest({
            status: 'error',
            message: `Connection failed: ${error.message}`,
          });
        } else {
          setConnectionTest({
            status: 'success',
            message: 'Successfully connected to Supabase!',
          });
        }
      } catch (err) {
        setConnectionTest({
          status: 'error',
          message: `Connection test failed: ${err}`,
        });
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Connection Test</h2>
          <div className="flex items-center gap-3">
            {connectionTest.status === 'pending' && (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <span className="text-gray-300">{connectionTest.message}</span>
              </>
            )}
            {connectionTest.status === 'success' && (
              <>
                <div className="text-2xl">✅</div>
                <span className="text-green-400 font-semibold">{connectionTest.message}</span>
              </>
            )}
            {connectionTest.status === 'error' && (
              <>
                <div className="text-2xl">❌</div>
                <span className="text-red-400">{connectionTest.message}</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300 mb-3">
              The app expects these environment variables to be set:
            </p>
            <div className="bg-gray-900 rounded p-4 font-mono">
              <div className="text-gray-400">VITE_SUPABASE_URL</div>
              <div className="text-gray-400">VITE_SUPABASE_ANON_KEY</div>
            </div>
            <p className="text-gray-400 mt-4 text-xs">
              Note: Make sure these same values are configured in:
              <br />• Your local <code className="bg-gray-900 px-1 rounded">.env</code> file
              <br />• Bolt secrets (if deploying via Bolt)
              <br />• Any Android build configuration
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
