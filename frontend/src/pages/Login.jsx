import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import supabase from '../lib/supabase';

const Login = () => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', identifier: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.identifier, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server — please check your connection and try again');
      } else {
        setError(err.response.data?.error || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nom-50 to-orange-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-nom-600 tracking-tight">
            NOM<span className="text-gray-800">inEat</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Stop arguing. Start eating.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="nom_master"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nom-400"
                />
              </div>
            )}

            {mode === 'login' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Email or Username
                </label>
                <input
                  name="identifier"
                  type="text"
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="nom_master or you@example.com"
                  required
                  autoComplete="username"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nom-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nom-400"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nom-400"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" size="full" loading={loading} className="mt-2">
              {mode === 'login' ? 'Log in' : 'Create account'}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
