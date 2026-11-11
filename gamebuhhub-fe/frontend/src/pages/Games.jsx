import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GameGrid from '../components/GameGrid';
import { getGames } from '../api/backend';

export default function Games() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('search') || '');
  const [genre, setGenre] = useState('all');
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function load() {
      setStatus('loading');
      setError(null);

      try {
        const results = await getGames(query.trim());

        if (active) {
          setGames(results);
          setStatus('success');
        }
      } catch (err) {
        if (active) {
          setError(err);
          setStatus('error');
        }
      }
    }

    const timer = setTimeout(load, query ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, reloadKey]);

  const genres = [...new Set(games.map((game) => game.genre).filter(Boolean))];
  const visibleGames = games.filter(
    (game) => genre === 'all' || game.genre === genre,
  );

  const chipClass = (active) =>
    'rounded-full border px-3 py-1 text-sm transition ' +
    (active
      ? 'border-emerald-500 bg-emerald-500 text-white'
      : 'border-emerald-200 bg-white text-slate-600 hover:bg-emerald-50');

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">เกมทั้งหมด</h1>
          <p className="text-sm text-slate-500">
            ข้อมูลจาก IGDB{' '}
            {status === 'success' && `| พบ ${visibleGames.length} เกม`}
          </p>
        </div>

      <label className="relative block w-full md:w-72">
          <span className="sr-only">ค้นหาชื่อเกม</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อเกม..."
            aria-label="ค้นหาชื่อเกม"
            className="h-12 w-full rounded-full border border-transparent bg-[#202024] py-3 pl-12 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 hover:bg-[#26262a] focus:border-transparent focus:bg-[#26262a] focus:ring-2 focus:ring-white/10"
          />
        </label>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setGenre('all')}
          className={chipClass(genre === 'all')}
        >
          ทุกแนว
        </button>

        {genres.map((item) => (
          <button
            key={item}
            onClick={() => setGenre(item)}
            className={chipClass(genre === item)}
          >
            {item}
          </button>
        ))}
      </div>

      <GameGrid
        games={visibleGames}
        status={status}
        error={error}
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    </main>
  );
}
