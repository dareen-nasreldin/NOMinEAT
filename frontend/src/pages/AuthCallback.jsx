import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    const handle = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          navigate('/login');
          return;
        }
        await loginWithGoogle(session.access_token);
        navigate('/dashboard');
      } catch {
        navigate('/login');
      }
    };
    handle();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Signing you in...</p>
    </div>
  );
};

export default AuthCallback;
