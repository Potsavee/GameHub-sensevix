import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getGame,
  getGameWishlist,
  removeGameFromWishlist,
} from '../api/backend';

export default function GameWishlist() {
  const { member, token } = useAuth();
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleGames = normalizedQuery
    ? games.filter((game) =>
        game.title?.toLocaleLowerCase().includes(normalizedQuery),
      )
    : games;

  useEffect(() => {
    let active = true;
    setStatus('loading');

    getGameWishlist(token)
      .then((result) => {
        const items = result.items.map((item) => ({
          id: item.gameId,
          title: item.title,
          poster: item.poster,
          year: item.year ?? null,
        }));

        if (!active) return;

        setGames(items);
        setStatus('success');

        // Fetch each game's release year when it isn't included in the wishlist response.
        Promise.all(
          items
            .filter((game) => !game.year)
            .map(async (game) => {
              try {
                const details = await getGame(game.id);
                return { id: game.id, year: details.year ?? null };
              } catch {
                return { id: game.id, year: null };
              }
            }),
        ).then((updates) => {
          if (active) {
            setGames((current) =>
              current.map((game) => {
                const update = updates.find((item) => item.id === game.id);
                return update ? { ...game, year: update.year } : game;
              }),
            );
          }
        });
      })
      .catch((err) => {
        if (active) {
          setError(err);
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function removeFromWishlist(gameId) {
    setRemovingId(gameId);
    setError(null);

    try {
      await removeGameFromWishlist(gameId, token);
      setRemovingId(null);
      setLeavingId(gameId);
      await new Promise((resolve) => window.setTimeout(resolve, 220));
      setGames((current) => current.filter((game) => game.id !== gameId));
    } catch (err) {
      setError(err);
    } finally {
      setRemovingId(null);
      setLeavingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Wishlist ของ {member?.displayName}
          </h1>
          <p className="text-sm text-slate-500">
            เกมที่บันทึกไว้สำหรับเล่นภายหลัง
          </p>
        </div>

        <label className="relative block w-full sm:w-72">
          <span className="sr-only">ค้นหาเกมใน Wishlist</span>
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
            placeholder="ค้นหาใน Wishlist..."
            aria-label="ค้นหาเกมใน Wishlist"
            className="h-12 w-full rounded-full border border-transparent bg-[#202024] py-3 pl-12 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 hover:bg-[#26262a] focus:border-transparent focus:bg-[#26262a] focus:ring-2 focus:ring-white/10"
          />
        </label>
      </div>

      {error && status !== 'error' && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error.message || 'นำเกมออกจาก Wishlist ไม่สำเร็จ'}
        </p>
      )}

      {status === 'loading' && (
        <div
          role="status"
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="aspect-[2/3] animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      )}

      {status === 'error' && (
        <p role="alert" className="py-16 text-center text-red-600">
          โหลด Wishlist ไม่สำเร็จ: {error?.message}
        </p>
      )}

      {status === 'success' && !games.length && (
        <p className="py-16 text-center text-slate-400">
          ยังไม่มีเกมใน Wishlist
        </p>
      )}

      {status === 'success' && games.length > 0 && !visibleGames.length && (
        <p className="py-16 text-center text-slate-400">
          ไม่พบเกมใน Wishlist ที่ตรงกับคำค้น
        </p>
      )}

      {status === 'success' && visibleGames.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visibleGames.map((game) => (
            <article
              key={game.id}
              className={`group overflow-hidden rounded-xl border border-emerald-100 bg-white transition hover:border-emerald-300 hover:shadow-md${
                leavingId === game.id ? ' wishlist-card-out' : ''
              }`}
            >
              <Link to={`/games/${game.id}`} className="block">
                {game.poster ? (
                  <img
                    src={game.poster}
                    alt={`ปกเกม ${game.title}`}
                    loading="lazy"
                    className="aspect-[2/3] w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-[2/3] w-full place-items-center bg-slate-100 text-4xl">
                    🎮
                  </div>
                )}

                <div className="px-3 pt-3">
                  <h2
                    className="truncate font-medium text-slate-900"
                    title={game.title}
                  >
                    {game.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {game.year ?? 'ไม่ระบุปี'}
                  </p>
                </div>
              </Link>

              <div className="flex justify-end px-3 pb-3 pt-2">
                <button
                  type="button"
                  onClick={() => removeFromWishlist(game.id)}
                  disabled={
                    removingId === game.id || leavingId === game.id
                  }
                  aria-label={`นำ ${game.title} ออกจาก Wishlist`}
                  title="ลบออกจาก Wishlist"
                  className="grid h-8 w-8 place-items-center border-0 bg-transparent p-0 text-red-500 transition duration-200 hover:scale-110 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-wait disabled:opacity-60"
                >
                  {removingId === game.id || leavingId === game.id ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-6 w-6"
                    >
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6"
                    >
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                    </svg>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
