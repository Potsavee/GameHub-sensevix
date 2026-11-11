import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GameGrid from '../components/GameGrid';
import { getGames } from '../api/backend';

export default function Games() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('search') || '');
  const [genre, setGenre] = useState('all');
  const [games, setGames] = useState([]);
  const [genreCatalog, setGenreCatalog] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const genreTrackRef = useRef(null);
  const genreCatalogLoaded = useRef(false);

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function load() {
      setStatus('loading');
      setError(null);

      try {
        const searchQuery = query.trim();
        const resultsPromise = getGames(searchQuery);

        // โหลดหมวดจากคลังเกมทั้งหมดครั้งเดียว แยกจากผลค้นหา
        const catalogPromise = genreCatalogLoaded.current
          ? Promise.resolve(null)
          : searchQuery
            ? getGames()
            : resultsPromise;

        const [results, catalog] = await Promise.all([
          resultsPromise,
          catalogPromise,
        ]);

        if (!active) return;

        setGames(results);

        if (catalog) {
          setGenreCatalog(catalog);
          genreCatalogLoaded.current = true;
        }

        setStatus('success');
      } catch (err) {
        if (active) {
          setError(err);
          setStatus('error');
        }
      }
    }

    const timer = setTimeout(load, query.trim() ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, reloadKey]);

  const genres = [...new Set(
    genreCatalog.map((game) => game.genre).filter(Boolean),
  )]
    .map((name) => ({
      name,
      games: genreCatalog.filter((game) => game.genre === name),
    }))
    .sort((a, b) => b.games.length - a.games.length);

  const visibleGames = games.filter(
    (game) => genre === 'all' || game.genre === genre,
  );

  function scrollGenres(direction) {
    genreTrackRef.current?.scrollBy({
      left: direction * 320,
      behavior: 'smooth',
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <section
        className="popular-genres"
        aria-labelledby="popular-genres-title"
      >
        <div className="popular-genres-heading">
          <h2 id="popular-genres-title">Genres</h2>

          <div className="popular-genres-controls">
            <button
              type="button"
              aria-label="เลื่อนหมวดหมู่ไปทางซ้าย"
              onClick={() => scrollGenres(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="เลื่อนหมวดหมู่ไปทางขวา"
              onClick={() => scrollGenres(1)}
            >
              ›
            </button>
          </div>
        </div>

        <div ref={genreTrackRef} className="genre-carousel-track">
          {genres.map(({ name, games: genreGames }) => {
            const covers = genreGames
              .filter((game) => game.poster)
              .slice(0, 3);
            const selected = genre === name;

            return (
              <button
                key={name}
                type="button"
                onClick={() => setGenre(selected ? 'all' : name)}
                aria-pressed={selected}
                className={`genre-card${selected ? ' is-selected' : ''}`}
              >
                <span className="genre-card-art" aria-hidden="true">
                  {covers.length ? (
                    covers.map((game, index) => (
                      <img
                        key={game.id}
                        src={game.poster}
                        alt=""
                        className={`genre-cover genre-cover-${index + 1}`}
                      />
                    ))
                  ) : (
                    <span className="genre-card-placeholder">🎮</span>
                  )}
                </span>

                <span className="genre-card-title">{name} Games</span>
                <span className="genre-card-count">
                  {genreGames.length} games
                </span>
              </button>
            );
          })}
        </div>

      <button
        type="button"
        onClick={() => setGenre('all')}
        disabled={genre === 'all'}
        aria-hidden={genre === 'all'}
        className={`clear-genre-filter${genre === 'all' ? ' is-hidden' : ''}`}
      >
        ล้างตัวกรอง · {genre}
      </button>
      </section>

      <div className="mb-5 mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">All Game</h1>
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

      <GameGrid
        games={visibleGames}
        status={status}
        error={error}
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    </main>
  );
}
