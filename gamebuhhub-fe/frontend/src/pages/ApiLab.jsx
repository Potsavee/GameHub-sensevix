import { useState } from 'react';
import { getGames } from '../api/backend';

export default function ApiLab() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  async function search(event) {
    event.preventDefault(); setStatus('loading'); setError(''); setOutput('');
    try { const games = await getGames(query); setOutput(JSON.stringify(games, null, 2)); setStatus(games.length ? 'success' : 'empty'); }
    catch (err) { setError(err.message); setStatus('error'); }
  }
  return <section className="mx-auto max-w-4xl px-4 py-10">
    <h1 className="text-2xl font-semibold">ทดลอง IGDB API</h1>
    <p className="mt-2 text-sm text-slate-600">React ส่ง Fetch ไป Go; Go เรียก IGDB แล้วส่ง JSON กลับมา</p>
    <form onSubmit={search} className="my-5 flex gap-2"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ชื่อเกม หรือเว้นว่างเพื่อดูเกมยอดนิยม" className="min-w-0 flex-1 rounded border px-3 py-2" /><button disabled={status==='loading'} className="rounded bg-emerald-600 px-4 text-white">ค้นหา</button></form>
    {status==='loading' && <p role="status">กำลังโหลด…</p>}{status==='empty' && <p>ไม่พบเกม</p>}{status==='error' && <p role="alert" className="text-red-700">{error}</p>}{output && <pre className="max-h-[60vh] overflow-auto rounded bg-slate-900 p-4 text-xs text-emerald-100">{output}</pre>}
  </section>;
}
