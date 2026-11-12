import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGame } from '../api/backend';

const gameDetailsCache = new Map();

function getCachedGameDetails(gameId) {
  if (!gameDetailsCache.has(gameId)) {
    const request = getGame(gameId).catch(error => {
      gameDetailsCache.delete(gameId);
      throw error;
    });
    gameDetailsCache.set(gameId, request);
  }

  return gameDetailsCache.get(gameId);
}

export default function GameCard({ game }) {
  const cardRef = useRef(null);
  const [rating, setRating] = useState(game.rating ?? null);

  useEffect(() => {
    if (game.rating != null) {
      setRating(game.rating);
      return undefined;
    }

    let active = true;

    const loadRating = () => {
      getCachedGameDetails(game.id)
        .then(details => {
          if (active) setRating(details.rating ?? null);
        })
        .catch(() => {});
    };

    if (!cardRef.current || typeof IntersectionObserver === 'undefined') {
      loadRating();
      return () => {
        active = false;
      };
    }

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        loadRating();
      }
    }, { rootMargin: '200px' });

    observer.observe(cardRef.current);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [game.id, game.rating]);

  return (
    <Link
      ref={cardRef}
      to={`/games/${game.id}`}
      className="group block overflow-hidden rounded-xl border border-emerald-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
    >
      {game.poster ? (
        <img
          src={game.poster}
          alt={`ปกเกม ${game.title}`}
          loading="lazy"
          className="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
        />
      ) : (
        <div className="grid aspect-[2/3] w-full place-items-center bg-slate-100 text-4xl transition-transform duration-500 group-hover:scale-[1.035]">
          🎮
        </div>
      )}

      <div className="p-3">
        <h3 className="truncate font-medium text-slate-900" title={game.title}>
          {game.title}
        </h3>

        <div className="mt-1 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-400">
            {game.year ?? 'ไม่ระบุปี'}
          </span>

          {rating != null && (
            <span className="shrink-0 font-semibold text-amber-400" title="คะแนนเฉลี่ย IGDB">
              ★ {Number(rating).toFixed(1)}/10
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
