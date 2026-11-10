import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGames } from '../api/backend';
import FeaturedGames from '../components/FeaturedGames';

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Home() {
  const [picks, setPicks] = useState([]);
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    let active = true;
    getGames().then(games => { if (active) { setPicks(shuffle(games)); setStatus('success'); } })
      .catch(() => { if (active) { setPicks([]); setStatus('error'); } });
    return () => { active = false; };
  }, []);

  return <div className="mx-auto max-w-5xl px-4 md:px-6">
    <section className="py-14 md:py-20">
      <p className="text-sm font-medium text-emerald-600">GameReview · React + Go + IGDB</p>
      <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">ค้นหาเกม อ่านรีวิว แล้วเลือกเกมถัดไปของคุณ</h1>
      <p className="mt-4 max-w-xl text-slate-600">ดูข้อมูลเกมจาก IGDB เขียนรีวิวกับสมาชิก และเก็บเกมที่อยากเล่นไว้ใน Wishlist</p>
      <Link to="/games" className="mt-6 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">สำรวจเกม</Link>
    </section>
    <section className="pb-12">
      <div className="mb-4 flex items-end justify-between">
        <div><h2 className="text-xl font-semibold text-slate-900">เกมแนะนำ</h2><p className="text-sm text-slate-500">ข้อมูลจาก IGDB</p></div>
        <button disabled={status !== 'success'} onClick={() => setPicks(shuffle(picks))} className="text-sm text-emerald-600 hover:underline disabled:opacity-50">สุ่มใหม่</button>
      </div>
      {status === 'loading' && <p role="status" className="py-10 text-center text-slate-500">กำลังโหลดเกมแนะนำ…</p>}
      {status === 'error' && <p role="alert" className="py-10 text-center text-red-600">โหลดเกมแนะนำไม่สำเร็จ ลองค้นหาเกมที่หน้าเกม</p>}
      {status === 'success' && picks.length === 0 && <p className="py-10 text-center text-slate-500">ยังไม่มีเกมแนะนำ</p>}
      {status === 'success' && picks.length > 0 && <FeaturedGames games={picks} />}
    </section>
  </div>;
}
