import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

// Always resolve an error to a string. A backend/platform 500 can return
// `{ error: { code, message } }`; rendering that object directly throws
// React error #31 and white-screens the page.
const toErrorMessage = (err, fallback = 'Sign-in failed. Please try again.') => {
  const data = err?.response?.data?.error;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') return data.message || data.code || fallback;
  return err?.message || fallback;
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let handled = false;

    const finish = async (session) => {
      if (handled) return;
      handled = true;
      try {
        await loginWithGoogle(session.access_token);
        navigate('/dashboard');
      } catch (err) {
        setError(toErrorMessage(err));
      }
    };

    // Primary: fires when the client processes the OAuth tokens from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) finish(session);
    });

    // Fallback: session may already be set if the client processed the hash synchronously
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish(session);
    });

    // Timeout: if nothing fires after 8s, surface an error instead of hanging
    const timeout = setTimeout(() => {
      if (!handled) setError('Sign-in timed out. Please try again.');
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-200 rounded-2xl shadow p-6 max-w-sm w-full space-y-3">
          <p className="text-red-600 font-bold text-sm">Sign-in failed</p>
          <p className="text-red-500 text-xs break-words">{error}</p>
          <button onClick={() => navigate('/login')} className="text-sm text-nom-500 hover:underline">
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
