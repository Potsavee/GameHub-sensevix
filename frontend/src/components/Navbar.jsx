import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0c0c0c]/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Mascot */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#e5b04a] flex items-center justify-center text-black font-black text-sm shadow-lg shadow-[#e5b04a]/20">
            GH
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-[#e5b04a] transition">
            GameHub<span className="text-[#e5b04a]">.</span>
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-widest text-gray-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#reviews" className="hover:text-white transition">Reviews</a>
          <a href="#security" className="hover:text-white transition">Security</a>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/profile"
                className="text-xs font-semibold px-4 py-2 rounded-full border border-white/10 bg-[#1b1b1b] text-gray-200 hover:border-white/20 hover:text-white transition"
              >
                {user.username} ({user.role})
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-xs font-semibold px-3 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
                >
                  Admin
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="text-xs font-semibold px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-gray-400 hover:text-white transition px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-gray-200 transition shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}