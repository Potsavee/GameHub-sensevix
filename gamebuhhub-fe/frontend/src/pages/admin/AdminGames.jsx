import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { deleteAdminGame, getAdminGames, updateAdminGame } from '../../api/backend';
import { ErrorBox, Loading } from '../../components/admin/AdminStates';

export default function AdminGames() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  useEffect(() => {
    let active = true;
    getAdminGames(token).then(value => { if (active) { setItems(value); setStatus('success'); } })
      .catch(err => { if (active) { setError(err); setStatus('error'); } });
    return () => { active = false; };
  }, [token, reload]);
  const shown = useMemo(() => items.filter(game => game.title.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  async function remove(game) {
    setBusy(game.id); setError(null);
    try { await deleteAdminGame(game.id, token); setItems(old => old.filter(item => item.id !== game.id)); setConfirming(null); }
    catch (err) { setError(err); }
    finally { setBusy(null); }
  }
  async function saveEdit(event) {
    event.preventDefault(); setBusy(editing.id); setError(null);
    try {
      const updated = await updateAdminGame(editing.id, {
        title: editing.title,
        titleTh: editing.titleTh,
        originalTitle: editing.originalTitle,
        originalLanguage: editing.originalLanguage,
        genre: editing.genre,
        releaseDate: editing.releaseDate ? new Date(editing.releaseDate).toISOString() : null,
        summary: editing.summary,
        summaryTh: editing.summaryTh,
        summaryEn: editing.summaryEn,
        poster: editing.poster || null,
      }, token);
      setItems(old => old.map(item => item.id === updated.id ? updated : item)); setEditing(null);
    } catch (err) { setError(err); }
    finally { setBusy(null); }
  }
  return <section>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">จัดการเกม</h2>{status === 'success' && <p className="text-sm text-slate-500">แสดง {shown.length} จาก {items.length} เกมในคลัง</p>}</div><input aria-label="ค้นหาเกมในคลัง" value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหาชื่อเกม" className="w-full rounded-lg border border-slate-300 px-3 py-2 sm:w-72" /></div>
    {status === 'loading' && <Loading />}
    {status === 'error' && <ErrorBox error={error} onRetry={() => { setStatus('loading'); setReload(n => n + 1); }} />}
    {status === 'success' && (shown.length === 0 ? <p className="rounded-xl border bg-white p-8 text-center text-slate-500">{items.length ? 'ไม่พบเกมที่ค้นหา' : 'ยังไม่มีเกมในคลัง'}</p> : <div className="overflow-x-auto rounded-xl border border-emerald-100 bg-white"><table className="w-full text-sm"><thead className="bg-emerald-50 text-left"><tr><th className="px-4 py-3">เกม</th><th className="px-4 py-3">รีวิว</th><th className="px-4 py-3 text-right">จัดการ</th></tr></thead><tbody className="divide-y">{shown.map(game => <tr key={game.id}><td className="px-4 py-3"><div className="flex items-center gap-3">{game.poster && <img src={game.poster} alt="" className="h-14 w-10 rounded object-cover" />}<div><p className="font-medium">{game.title}</p><p className="text-xs text-slate-400">IGDB #{game.id}</p></div></div></td><td className="px-4 py-3">{game.reviewCount}</td><td className="space-x-3 px-4 py-3 text-right"><button onClick={() => setEditing({ ...game })} className="text-emerald-700">แก้ไข</button><button disabled={busy === game.id} onClick={() => setConfirming(game)} className="text-red-600 disabled:opacity-50">ลบเกม</button></td></tr>)}</tbody></table></div>)}
    {editing && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4"><form onSubmit={saveEdit} className="mx-auto my-6 grid w-full max-w-5xl gap-6 rounded-xl bg-white p-6 shadow-xl lg:grid-cols-[1fr_230px]"><div className="space-y-4"><h3 className="text-lg font-semibold">แก้ไขข้อมูลเกม</h3><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">ชื่อเกม *<input required maxLength={255} value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm">ชื่อไทย<input value={editing.titleTh || ''} onChange={e => setEditing({ ...editing, titleTh: e.target.value })} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm">ชื่อภาษาต้นฉบับ<input value={editing.originalTitle || ''} onChange={e => setEditing({ ...editing, originalTitle: e.target.value })} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm">ภาษาต้นฉบับ (2 ตัวอักษร)<input maxLength={2} value={editing.originalLanguage || ''} onChange={e => setEditing({ ...editing, originalLanguage: e.target.value })} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm">แนวหลัก<input value={editing.genre || ''} onChange={e => setEditing({ ...editing, genre: e.target.value })} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm">วันวางจำหน่าย<input type="date" value={editing.releaseDate ? editing.releaseDate.slice(0, 10) : ''} onChange={e => setEditing({ ...editing, releaseDate: e.target.value })} className="mt-1 w-full rounded border p-2" /></label></div><label className="block text-sm">โปสเตอร์ (URL)<input value={editing.poster || ''} onChange={e => setEditing({ ...editing, poster: e.target.value })} className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm">เรื่องย่อภาษาไทย<textarea value={editing.summaryTh || ''} onChange={e => setEditing({ ...editing, summaryTh: e.target.value })} className="mt-1 w-full rounded border p-2" rows={4} /></label><label className="block text-sm">เรื่องย่อภาษาอังกฤษ<textarea value={editing.summaryEn || editing.summary || ''} onChange={e => setEditing({ ...editing, summaryEn: e.target.value })} className="mt-1 w-full rounded border p-2" rows={4} /></label><div className="flex flex-wrap justify-between gap-2 border-t pt-4"><button type="button" onClick={() => setEditing(null)} className="rounded border px-4 py-2">ยกเลิก</button><div className="flex gap-2"><button disabled={busy === editing.id} className="rounded bg-emerald-500 px-4 py-2 text-white">{busy === editing.id ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}</button><button type="button" onClick={() => { setConfirming(editing); setEditing(null); }} className="rounded border border-red-300 px-4 py-2 text-red-600">ลบเกมนี้</button></div></div></div><aside className="space-y-4"><div className="overflow-hidden rounded-xl border">{editing.poster ? <img src={editing.poster} alt="ตัวอย่างโปสเตอร์" className="aspect-[2/3] w-full object-cover" /> : <div className="grid aspect-[2/3] place-items-center bg-slate-100 text-5xl">🎮</div>}<p className="p-2 text-center text-xs text-slate-500">ตัวอย่างโปสเตอร์</p></div><div className="rounded-xl border p-4 text-sm"><h4 className="font-semibold">ข้อมูลที่ผูกกับเกมนี้</h4><p className="mt-2">รีวิว {editing.reviewCount || 0}</p><p>IGDB #{editing.id}</p></div></aside>{error && <p role="alert" className="text-sm text-red-600 lg:col-span-2">{error.message}</p>}</form></div>}
    {confirming && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="confirm-delete-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-xl text-red-600">!</div><h3 id="confirm-delete-title" className="text-lg font-semibold text-slate-900">ยืนยันการลบเกม</h3><p className="mt-2 text-sm leading-6 text-slate-600">ต้องการลบ <strong>{confirming.title}</strong> ออกจากฐานข้อมูลหรือไม่? รีวิวและ Wishlist ที่ผูกกับเกมนี้จะถูกลบด้วย</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirming(null)} disabled={busy === confirming.id} className="rounded-lg border border-slate-300 px-4 py-2">ยกเลิก</button><button type="button" onClick={() => remove(confirming)} disabled={busy === confirming.id} className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-60">{busy === confirming.id ? 'กำลังลบ…' : 'ลบเกม'}</button></div></section></div>}
  </section>;
}
