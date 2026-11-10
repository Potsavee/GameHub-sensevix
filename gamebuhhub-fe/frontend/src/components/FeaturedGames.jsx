import { useState } from 'react';
import GameCard from './GameCard';

const PAGE_SIZE = 4;

export default function FeaturedGames({ games }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(games.length / PAGE_SIZE);
  if (!games.length) return <p className="py-10 text-center text-slate-400">ยังไม่มีเกมแนะนำ</p>;
  const visible = games.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  return <div><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{visible.map(game => <GameCard key={game.id} game={game} />)}</div><div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-500"><button onClick={() => setPage(current => (current - 1 + pageCount) % pageCount)} className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5">ก่อนหน้า</button><span>หน้า {page + 1} / {pageCount}</span><button onClick={() => setPage(current => (current + 1) % pageCount)} className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5">ถัดไป</button></div></div>;
}
