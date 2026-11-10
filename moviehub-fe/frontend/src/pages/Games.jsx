import { useEffect, useState } from 'react';
import GameGrid from '../components/GameGrid';
import { getGames } from '../api/backend';

export default function Games() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setStatus('loading'); setError(null);
      try {
        const results = await getGames(query.trim());
        if (active) { setGames(results); setStatus('success'); }
      } catch (err) {
        if (active) { setError(err); setStatus('error'); }
      }
    }
    const timer = setTimeout(load, query ? 300 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [query, reloadKey]);

  const genres = [...new Set(games.map(game => game.genre).filter(Boolean))];
  const visibleGames = games.filter(game => genre === 'all' || game.genre === genre);
  const chipClass = active => 'rounded-full border px-3 py-1 text-sm transition ' +
    (active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-emerald-200 bg-white text-slate-600 hover:bg-emerald-50');

  return <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><h1 className="text-2xl font-semibold text-slate-900">เกมทั้งหมด</h1><p className="text-sm text-slate-500">ข้อมูลจาก IGDB {status === 'success' && `| พบ ${visibleGames.length} เกม`}</p></div>
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาชื่อเกม..." aria-label="ค้นหาชื่อเกม" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 md:w-72" />
    </div>
    <div className="mb-6 flex flex-wrap gap-2">
      <button onClick={() => setGenre('all')} className={chipClass(genre === 'all')}>ทุกแนว</button>
      {genres.map(item => <button key={item} onClick={() => setGenre(item)} className={chipClass(genre === item)}>{item}</button>)}
    </div>
    <GameGrid games={visibleGames} status={status} error={error} onRetry={() => setReloadKey(key => key + 1)} />
  </main>;
}
