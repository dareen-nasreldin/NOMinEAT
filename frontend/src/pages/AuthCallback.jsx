import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = async () => {
      try {
        const code = new URL(window.location.href).searchParams.get('code');

        let session = null;

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(`Code exchange failed: ${exchangeError.message}`);
            return;
          }
          session = data.session;
        } else {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            setError(`Session error: ${sessionError.message}`);
            return;
          }
          session = data.session;
        }

        if (!session) {
          setError('No session returned from Google. Please try again.');
          return;
        }

        await loginWithGoogle(session.access_token);
        navigate('/dashboard');
      } catch (err) {
        setError(err?.response?.data?.error || err?.message || 'Sign-in failed. Please try again.');
      }
    };

    handle();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow p-6 max-w-sm w-full text-center space-y-4">
          <p className="text-red-500 text-sm font-medium">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-nom-500 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Signing you in...</p>
    </div>
  );
};

export default AuthCallback;
