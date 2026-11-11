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
    <header className="relative z-20 border-b border-emerald-100 bg-white">
      <nav aria-label="เมนูหลัก" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 md:px-6">
        <Link to="/" className="shrink-0 text-lg font-semibold tracking-tight text-emerald-600">
          🎮 GameReview
        </Link>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <NavLink to="/" end className={linkClass}>หน้าแรก</NavLink>
          <NavLink to="/games" className={linkClass}>เกม</NavLink>
          {isLoggedIn && <NavLink to="/me/wishlist" className={linkClass}>Wishlist</NavLink>}
          <NavLink to="/about" className={linkClass}>เกี่ยวกับ</NavLink>
          {isAdmin && <NavLink to="/admin" className={linkClass}>หลังบ้าน</NavLink>}
        </div>

        <div className="ml-auto flex items-center gap-3 text-sm">
          <NavLink
            to="/lab"
            className={({ isActive }) => 'rounded-full border px-3 py-1.5 text-xs font-semibold transition ' + (isActive
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700')}
          >
            API Lab
          </NavLink>

          {isLoggedIn ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(open => !open)}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-2 font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <span>สวัสดี {member?.displayName || 'สมาชิก'}</span>
                <svg aria-hidden="true" className={'h-4 w-4 transition-transform ' + (menuOpen ? 'rotate-180' : '')} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.09 1.032l-4.25 4.3a.75.75 0 0 1-1.08 0l-4.25-4.3a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                </svg>
              </button>

              {menuOpen && (
                <div role="menu" aria-label="เมนูบัญชีผู้ใช้" className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <Link role="menuitem" to="/me/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">
                    โปรไฟล์
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button role="menuitem" type="button" onClick={handleLogout} className="block w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50">
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="whitespace-nowrap rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-700 hover:bg-emerald-50">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
