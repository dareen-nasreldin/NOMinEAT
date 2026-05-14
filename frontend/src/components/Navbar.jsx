import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xl font-extrabold tracking-tight text-nom-600 hover:text-nom-700 transition-colors"
        >
          NOM<span className="text-gray-800">inEat</span>
        </button>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              Hey, <span className="font-semibold text-gray-700">{user.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors font-medium"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
