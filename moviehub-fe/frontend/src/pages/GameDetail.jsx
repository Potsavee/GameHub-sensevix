import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deleteGameReview, getGame, getReviews, postReview } from '../api/backend';
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

  useEffect(() => {
    let active = true;
    setStatus('loading'); setError(null);
    getGame(id).then(result => { if (active) { setGame(result); setStatus('success'); } })
      .catch(err => { if (active) { setError(err); setStatus('error'); } });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    setReviewStatus('loading'); setReviewError(null);
    getReviews(id).then(result => { if (active) { setReviews(result.items); setReviewStatus('success'); } })
      .catch(err => { if (active) { setReviewError(err); setReviewStatus('error'); } });
    return () => { active = false; };
  }, [id]);

  async function submitReview(text) {
    const saved = await postReview(id, text, token);
    setReviews(current => [{ ...saved, memberId: member.id, member: { id: member.id, displayName: member.displayName } }, ...current]);
  }

  async function removeReview(reviewId) {
    try {
      await deleteGameReview(reviewId, token);
      setReviews(current => current.filter(review => review.id !== reviewId));
    } catch (err) { setReviewError(err); }
  }

  if (status === 'loading') return <div className="mx-auto max-w-4xl animate-pulse px-4 py-10" role="status">กำลังโหลดข้อมูลเกม…</div>;
  if (status === 'error') return <section className="mx-auto max-w-xl px-4 py-20 text-center"><p className="text-lg">โหลดเกมไม่สำเร็จ</p><p role="alert" className="text-sm text-red-600">{error?.message}</p><Link to="/games" className="mt-6 inline-block text-sm text-emerald-600">กลับไปหน้ารวมเกม</Link></section>;

  return <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
    <Link to="/games" className="text-sm text-slate-500 hover:text-emerald-600">กลับไปหน้ารวมเกม</Link>
    <div className="mt-4 flex flex-col gap-8 md:flex-row">
      {game.poster ? <img src={game.poster} alt={`ปกเกม ${game.title}`} className="w-48 shrink-0 self-start rounded-xl border border-slate-200" /> : <div className="grid aspect-[2/3] w-48 shrink-0 place-items-center rounded-xl bg-slate-100 text-5xl">🎮</div>}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{game.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{game.year ?? 'ไม่ระบุปี'}{game.genre && ` | ${game.genre}`}{game.rating != null && ` | ⭐ ${game.rating}`}</p>
        <p className="mt-4 leading-relaxed text-slate-700">{game.detail}</p>
        <GameActions gameId={game.id} />
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">รีวิวจากสมาชิก ({reviews.length})</h2>
          {reviewStatus === 'loading' && <p role="status">กำลังโหลดรีวิว…</p>}
          {reviewStatus === 'error' && <p role="alert" className="text-sm text-red-600">โหลดรีวิวไม่สำเร็จ: {reviewError?.message}</p>}
          {reviewStatus === 'success' && <ReviewList items={reviews} memberId={member?.id} isAdmin={member?.role === 'admin'} onDelete={isLoggedIn ? removeReview : null} />}
        </section>
        <section className="mt-6 rounded-xl border border-emerald-100 bg-white p-5">
          {isLoggedIn ? <ReviewForm key={game.id} gameTitle={game.title} onSubmit={submitReview} /> : <p className="text-sm text-slate-500"><Link to="/login" className="text-emerald-600 hover:underline">เข้าสู่ระบบ</Link> เพื่อเขียนรีวิว</p>}
        </section>
      </div>
    </div>
  </main>;
}
