import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { addGameToWishlist, getGameWishlist, removeGameFromWishlist } from '../api/backend';

export default function GameActions({ gameId }) {
  const { isLoggedIn, token } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!isLoggedIn) { setInWishlist(false); return undefined; }
    let active = true;
    getGameWishlist(token).then(result => {
      if (active) setInWishlist(result.items.some(item => item.gameId === Number(gameId)));
    }).catch(() => { if (active) setMessage('โหลดสถานะ Wishlist ไม่สำเร็จ'); });
    return () => { active = false; };
  }, [gameId, isLoggedIn, token]);
  if (!isLoggedIn) return (
    <div className="guest-wishlist-prompt text-sm text-slate-500">
      <span>
        <Link to="/login" className="text-emerald-600 hover:underline">เข้าสู่ระบบ</Link>{' '}
        เพื่อเพิ่มเกมเข้ารายการที่อยากเล่น
      </span>
    </div>
  );

  async function toggleWishlist() {
    setBusy(true); setMessage('');
    try {
      if (inWishlist) { await removeGameFromWishlist(gameId, token); setInWishlist(false); setMessage('นำเกมออกจาก Wishlist แล้ว'); }
      else { await addGameToWishlist(gameId, token); setInWishlist(true); setMessage('เพิ่มเกมเข้า Wishlist แล้ว'); }
    } catch (err) { setMessage(err.message || 'อัปเดต Wishlist ไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-2">
    <button
      type="button"
      disabled={busy}
      onClick={toggleWishlist}
      aria-pressed={inWishlist}
      className="inline-flex items-center gap-2 rounded-xl border border-[#CCE3E3] bg-white px-4 py-2.5 text-sm font-medium text-[#1E293B] transition duration-150 hover:bg-[#F8FAFC] active:scale-[0.97] active:bg-[#E6F2F2] disabled:cursor-wait disabled:opacity-60"
    >
      <svg
        key={inWishlist ? 'filled-heart' : 'outline-heart'}
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={inWishlist ? 'wishlist-heart-pop h-5 w-5 fill-[#E53935] stroke-[#E53935]' : 'h-5 w-5 fill-none stroke-[#1E293B]'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
      </svg>
      <span>{inWishlist ? 'อยู่ใน Wishlist แล้ว' : 'เพิ่มเข้า Wishlist'}</span>
    </button>
    {message && <p role="status" className="sr-only">{message}</p>}
  </div>;
}
