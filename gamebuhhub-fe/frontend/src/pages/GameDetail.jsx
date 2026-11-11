import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch, deleteGameReview, getGame, getReviews, postReview } from '../api/backend';
import { useAuth } from '../auth/AuthContext';
import GameActions from '../components/GameActions';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';

export default function GameDetail() {
  const { id } = useParams();
  const { isLoggedIn, member, token } = useAuth();
  const [game, setGame] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStatus, setReviewStatus] = useState('loading');
  const [reviewError, setReviewError] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [mediaStatus, setMediaStatus] = useState('loading');
  const [mediaError, setMediaError] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setError(null);
    getGame(id)
      .then(result => { if (active) { setGame(result); setStatus('success'); } })
      .catch(err => { if (active) { setError(err); setStatus('error'); } });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    setReviewStatus('loading');
    setReviewError(null);
    getReviews(id)
      .then(result => { if (active) { setReviews(result.items); setReviewStatus('success'); } })
      .catch(err => { if (active) { setReviewError(err); setReviewStatus('error'); } });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    setMediaStatus('loading');
    setMediaError(null);
    setScreenshots([]);
    setSelectedKey(null);
    apiFetch(`/api/games/${id}/screenshots`).then(result => {
      if (!active) return;
      setScreenshots(result.items ?? []);
      setMediaStatus('success');
    }).catch(err => {
      if (!active) return;
      setMediaError(`ภาพ: ${err?.message || 'เรียก API ไม่สำเร็จ'}${err?.status ? ` (HTTP ${err.status})` : ''}`);
      setMediaStatus('success');
    });
    return () => { active = false; };
  }, [id]);

  async function submitReview(text, score) {
    const saved = await postReview(id, text, score, token);
    setReviews(current => [{ ...saved, memberId: member.id, member: { id: member.id, displayName: member.displayName } }, ...current]);
  }

  async function removeReview(reviewId) {
    try {
      await deleteGameReview(reviewId, token);
      setReviews(current => current.filter(review => review.id !== reviewId));
    } catch (err) {
      setReviewError(err);
    }
  }

  const gallery = useMemo(() => screenshots.map((image, index) => ({ key: `image-${index}`, url: image.url })), [screenshots]);
  const activeMedia = gallery.find(item => item.key === selectedKey) || gallery[0] || null;

  if (status === 'loading') {
    return <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 text-slate-500" role="status">กำลังโหลดข้อมูลเกม…</div>;
  }
  if (status === 'error') {
    return <section className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-lg">โหลดเกมไม่สำเร็จ</p>
      <p role="alert" className="text-sm text-red-600">{error?.message}</p>
      <Link to="/games" className="mt-6 inline-block text-sm text-emerald-600">กลับไปหน้ารวมเกม</Link>
    </section>;
  }

  const mediaImage = activeMedia?.url || game.poster;
  const release = game.releaseDate || game.year || 'ไม่ระบุปี';

  return <main className="min-h-screen bg-[#f3faf7] text-slate-900">
    <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-emerald-100 bg-white px-5 py-5 shadow-sm md:px-8">
        {game.poster && <div aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center opacity-[0.09] blur-2xl" style={{ backgroundImage: `url("${game.poster}")` }} />}
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-xs text-slate-500">
              <Link to="/games" className="hover:text-emerald-700">เกมทั้งหมด</Link>
              <span className="mx-2">›</span><span>{game.genre || 'เกม'}</span>
              <span className="mx-2">›</span><span>{game.title}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{game.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {game.year ?? 'ไม่ระบุปี'}{game.genre && ` · ${game.genre}`}{game.rating != null && ` · คะแนน IGDB ${game.rating}/10`}
            </p>
          </div>
          <a href="#community" className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700">รีวิวจากชุมชน</a>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,0.92fr)]">
        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm" aria-label="ภาพตัวอย่างเกม">
          <div className="relative aspect-video bg-slate-950">
            {mediaStatus === 'loading' && <div className="grid h-full place-items-center text-emerald-100" role="status">กำลังโหลดภาพตัวอย่าง…</div>}
            {mediaStatus === 'success' && mediaImage && <img src={mediaImage} alt={`ภาพตัวอย่างเกม ${game.title}`} className="h-full w-full object-contain" onError={event => {
                if (game.poster && event.currentTarget.src !== game.poster) event.currentTarget.src = game.poster;
                else event.currentTarget.classList.add('hidden');
              }} />}
            {mediaStatus === 'success' && !mediaImage && <div className="grid h-full place-items-center text-center text-emerald-100"><div><span className="text-5xl" aria-hidden="true">🎮</span><p className="mt-3">เกมนี้ยังไม่มีภาพตัวอย่าง</p></div></div>}
            {mediaError && <p role="status" className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded bg-white/95 px-3 py-2 text-xs text-slate-700 shadow">{mediaError}{!gallery.length ? ' · แสดงภาพปกแทน' : ''}</p>}
          </div>

          <div className="flex items-center justify-between border-t border-emerald-100 px-4 py-3">
            <h2 className="font-semibold">ภาพตัวอย่างเกม</h2>
            <span className="text-xs text-slate-500">{screenshots.length} ภาพ</span>
          </div>
          {mediaStatus === 'success' && gallery.length > 0 ? <div className="flex gap-3 overflow-x-auto border-t border-emerald-50 bg-emerald-50/50 p-3">
            {gallery.map((item, index) => <button key={item.key} type="button" onClick={() => setSelectedKey(item.key)} aria-pressed={activeMedia?.key === item.key} aria-label={`เลือกภาพตัวอย่างที่ ${index + 1}`} className={`group relative w-36 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-900 transition md:w-44 ${activeMedia?.key === item.key ? 'border-emerald-500' : 'border-transparent opacity-75 hover:opacity-100'}`}>
              <img src={item.url} alt="" className="aspect-video w-full object-cover" onError={event => { event.currentTarget.src = game.poster || ''; }} />
            </button>)}
          </div> : mediaStatus === 'success' && <p className="border-t border-emerald-50 px-4 py-4 text-sm text-slate-500">ไม่มีภาพ Screenshot จาก IGDB หรือ Steam · ใช้ภาพปกเกมแทน</p>}
        </section>

        <aside className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="grid min-h-52 place-items-center bg-slate-900 p-4">
            {game.poster ? <img src={game.poster} alt={`ปกเกม ${game.title}`} className="max-h-64 w-full object-contain" /> : <span className="text-6xl" aria-hidden="true">🎮</span>}
          </div>
          <div className="p-5">
            <p className="text-sm leading-6 text-slate-600">{game.detail}</p>
            <dl className="mt-5 grid grid-cols-[110px_1fr] gap-y-3 border-t border-slate-100 pt-4 text-sm">
              <dt className="text-slate-500">รีวิวสมาชิก</dt><dd className="font-medium text-emerald-700">{reviews.length} รีวิว</dd>
              <dt className="text-slate-500">วันวางจำหน่าย</dt><dd>{release}</dd>
              <dt className="text-slate-500">แนวเกม</dt><dd>{game.genre || 'ไม่ระบุ'}</dd>
              {game.rating != null && <><dt className="text-slate-500">คะแนน IGDB</dt><dd className="font-semibold text-amber-600">★ {game.rating}/10</dd></>}
            </dl>
            <div className="mt-5 border-t border-slate-100 pt-4"><GameActions gameId={game.id} /></div>
          </div>
        </aside>
      </div>

      <section id="community" className="mt-8 scroll-mt-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-xl font-bold">รีวิวจากชุมชน</h2><span className="text-sm text-slate-500">{reviews.length} รีวิว</span></div>
        {reviewStatus === 'loading' && <p role="status" className="text-sm text-slate-500">กำลังโหลดรีวิว…</p>}
        {reviewStatus === 'error' && <p role="alert" className="text-sm text-red-600">โหลดรีวิวไม่สำเร็จ: {reviewError?.message}</p>}
        {reviewStatus === 'success' && <ReviewList items={reviews} memberId={member?.id} isAdmin={member?.role === 'admin'} onDelete={isLoggedIn ? removeReview : null} />}
        <div className="mt-6 border-t border-slate-100 pt-5">
          {isLoggedIn ? <div className="rounded-xl bg-emerald-50/60 p-4"><ReviewForm key={game.id} gameTitle={game.title} onSubmit={submitReview} /></div> : <p className="text-sm text-slate-500"><Link to="/login" className="font-medium text-emerald-700 hover:underline">เข้าสู่ระบบ</Link> เพื่อเขียนรีวิว</p>}
        </div>
      </section>
    </div>
  </main>;
}
