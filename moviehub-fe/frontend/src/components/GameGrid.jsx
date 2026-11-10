import GameCard from './GameCard';

export default function GameGrid({ games, status, error, onRetry }) {
  if (status === 'loading') return <div role="status" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[2/3] animate-pulse rounded-xl bg-slate-100" />)}</div>;
  if (status === 'error') return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center"><p className="font-medium text-red-700">โหลดข้อมูลไม่สำเร็จ</p><p className="mt-1 text-sm text-red-500">{error?.message}</p>{onRetry && <button onClick={onRetry} className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-red-700">ลองใหม่</button>}</div>;
  if (!games?.length) return <p className="py-16 text-center text-slate-400">ไม่พบเกมที่ค้นหา ลองคำอื่นดู</p>;
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{games.map(game => <GameCard key={game.id} game={game} />)}</div>;
}
