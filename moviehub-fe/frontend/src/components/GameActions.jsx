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
  if (!isLoggedIn) return <p className="mt-4 text-sm text-slate-500"><Link to="/login" className="text-emerald-600 hover:underline">เข้าสู่ระบบ</Link> เพื่อเพิ่มเกมเข้ารายการที่อยากเล่น</p>;

  async function toggleWishlist() {
    setBusy(true); setMessage('');
    try {
      if (inWishlist) { await removeGameFromWishlist(gameId, token); setInWishlist(false); setMessage('นำเกมออกจาก Wishlist แล้ว'); }
      else { await addGameToWishlist(gameId, token); setInWishlist(true); setMessage('เพิ่มเกมเข้า Wishlist แล้ว'); }
    } catch (err) { setMessage(err.message || 'อัปเดต Wishlist ไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-2"><button type="button" disabled={busy} onClick={toggleWishlist} aria-pressed={inWishlist} className="rounded-lg border border-emerald-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-50">{inWishlist ? '♥ อยู่ใน Wishlist แล้ว' : '♡ เพิ่มเข้า Wishlist'}</button>{message && <p role="status" className="text-sm text-slate-500">{message}</p>}</div>;
}
