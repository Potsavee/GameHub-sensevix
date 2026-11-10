import { Link } from 'react-router-dom';

export default function GameCard({ game }) {
  return <Link to={`/games/${game.id}`} className="group block overflow-hidden rounded-xl border border-emerald-100 bg-white transition hover:border-emerald-300 hover:shadow-md">
    {game.poster ? <img src={game.poster} alt={`ปกเกม ${game.title}`} loading="lazy" className="aspect-[2/3] w-full object-cover" /> : <div className="grid aspect-[2/3] w-full place-items-center bg-slate-100 text-4xl">🎮</div>}
    <div className="p-3"><h3 className="truncate font-medium text-slate-900" title={game.title}>{game.title}</h3><p className="mt-1 text-xs text-slate-400">{game.year ?? 'ไม่ระบุปี'}{game.rating != null && ` | ⭐ ${game.rating}`}</p></div>
  </Link>;
}
