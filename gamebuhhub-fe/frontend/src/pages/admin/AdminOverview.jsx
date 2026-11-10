import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getAdminOverview } from '../../api/backend';
import { ErrorBox, Loading } from '../../components/admin/AdminStates';

const cards = [
  ['เกม', 'games'], ['สมาชิก', 'members'], ['admin', 'admins'], ['รีวิว', 'reviews'], ['Wishlist', 'wishlists'],
];
const dateTH = value => new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminOverview() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    getAdminOverview(token).then(value => { if (active) { setData(value); setStatus('success'); } })
      .catch(err => { if (active) { setError(err); setStatus('error'); } });
    return () => { active = false; };
  }, [token, reload]);
  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorBox error={error} onRetry={() => { setStatus('loading'); setReload(n => n + 1); }} />;
  return <section>
    <h2 className="mb-5 text-lg font-semibold">ภาพรวมระบบ</h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label, key]) => <article key={key} className="rounded-xl border border-emerald-100 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{data[key]}</p></article>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <article className="min-h-56 rounded-xl border border-emerald-100 bg-white p-5"><h3 className="font-semibold">เกมที่มีรีวิวมากที่สุด</h3><p className="mb-4 text-xs text-slate-400">เรียงตามจำนวนรีวิวจากสมาชิก</p>
        {data.topReviewed?.length ? <ul className="divide-y">{data.topReviewed.map(game => <li key={game.id} className="flex items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3">{game.poster && <img src={game.poster} alt="" className="h-12 w-9 rounded object-cover" />}<div className="truncate"><p className="truncate font-medium">{game.title}</p><p className="text-xs text-slate-400">IGDB #{game.id}</p></div></div><span className="shrink-0 text-sm text-slate-600">{game.reviewCount} รีวิว</span></li>)}</ul> : <p className="py-10 text-center text-slate-400">ยังไม่มีรีวิว</p>}
      </article>
      <article className="min-h-56 rounded-xl border border-emerald-100 bg-white p-5"><h3 className="font-semibold">สมาชิกใหม่ล่าสุด</h3>
        {data.recentMembers?.length ? <ul className="mt-3 divide-y">{data.recentMembers.map(member => <li key={member.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate font-medium">{member.displayName}</p><p className="truncate text-sm text-slate-500">{member.email}</p></div><div className="flex shrink-0 items-center gap-3 text-sm"><span className={member.role === 'admin' ? 'rounded-full bg-emerald-100 px-2 py-1 text-emerald-700' : 'text-slate-500'}>{member.role === 'admin' ? 'admin' : ''}</span><span className="text-slate-400">{dateTH(member.createdAt)}</span></div></li>)}</ul> : <p className="py-10 text-center text-slate-400">ยังไม่มีสมาชิก</p>}
        <Link to="/admin/members" className="mt-3 inline-block text-sm text-emerald-700 hover:underline">ดูสมาชิกทั้งหมด</Link>
      </article>
    </div>
  </section>;
}
