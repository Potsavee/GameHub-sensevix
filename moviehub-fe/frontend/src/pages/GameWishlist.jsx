import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getGameWishlist } from '../api/backend';
import GameGrid from '../components/GameGrid';

export default function GameWishlist() {
  const { member, token } = useAuth();
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    getGameWishlist(token).then(result => {
      if (active) { setGames(result.items.map(item => ({ id: item.gameId, title: item.title, poster: item.poster }))); setStatus('success'); }
    }).catch(err => { if (active) { setError(err); setStatus('error'); } });
    return () => { active = false; };
  }, [token]);
  return <main className="mx-auto max-w-5xl px-4 py-10 md:px-6"><h1 className="text-2xl font-semibold">Wishlist ของ {member?.displayName}</h1><p className="mb-6 text-sm text-slate-500">เกมที่บันทึกไว้สำหรับเล่นภายหลัง</p><GameGrid games={games} status={status} error={error} /></main>;
}
