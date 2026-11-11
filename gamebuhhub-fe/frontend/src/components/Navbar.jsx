import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const linkClass = ({ isActive }) =>
  'whitespace-nowrap text-sm transition ' + (isActive ? 'font-medium text-emerald-600' : 'text-slate-600 hover:text-emerald-600');

function Navbar() {
  const { isLoggedIn, isAdmin, member, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const displayName = member?.displayName || 'Member';
  const avatar = member?.avatarUrl || member?.avatar || member?.photoURL;

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white">
      <nav aria-label="Main menu" className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 md:px-6">
        <div className="flex shrink-0 items-center gap-7">
          <Link to="/" aria-label="GameReview home" className="flex shrink-0 items-center">
            <img
              src="/gamereview-logo.png"
              alt="GameReview"
              className="h-12 w-56 object-contain"
            />
          </Link>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/games" className={linkClass}>Games</NavLink>
            {isLoggedIn && <NavLink to="/me/wishlist" className={linkClass}>Wishlist</NavLink>}
            <NavLink to="/about" className={linkClass}>About</NavLink>
            {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-4 text-sm">
          <NavLink to="/lab" title="API Lab" aria-label="API Lab" className={({ isActive }) => 'inline-flex items-center gap-1.5 px-1 py-2 text-xs transition ' + (isActive ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200')}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
              <path d="M8 3h8M9 3v6l-5 9a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-5-9V3" />
              <path d="M7 16h10" />
            </svg>
            <span className="hidden sm:inline">API Lab</span>
          </NavLink>

          {isLoggedIn ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(open => !open)}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-2 py-1.5 font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                {avatar ? (
                  <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-xs font-semibold text-white">
                    {displayName.trim().charAt(0).toUpperCase() || 'G'}
                  </span>
                )}
                <span>Hi, {displayName}</span>
                <svg aria-hidden="true" className={'h-4 w-4 transition-transform ' + (menuOpen ? 'rotate-180' : '')} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.09 1.032l-4.25 4.3a.75.75 0 0 1-1.08 0l-4.25-4.3a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                </svg>
              </button>

              {menuOpen && (
                <div role="menu" aria-label="Account menu" className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <Link role="menuitem" to="/me/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">
                    Profile
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button role="menuitem" type="button" onClick={handleLogout} className="block w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50">
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="whitespace-nowrap rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="whitespace-nowrap rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
