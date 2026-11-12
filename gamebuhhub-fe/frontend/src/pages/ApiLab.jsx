import { useState } from 'react';
import { apiFetch, getGames, searchGames } from '../api/backend';

export default function ApiLab() {
  const [query, setQuery] = useState('Grand Theft Auto V');
  const [status, setStatus] = useState('idle');
  const [output, setOutput] = useState('');
  const [ms, setMs] = useState(null);
  const [requestPath, setRequestPath] = useState('/api/games');

  const searchPath = `/api/games?q=${encodeURIComponent(query.trim())}`;

  async function run(path, request) {
    setStatus('loading');
    setOutput('');
    setRequestPath(path);
    const startedAt = performance.now();

    try {
      const data = await request();
      setOutput(JSON.stringify(data, null, 2));
      const items = Array.isArray(data) ? data : data?.items;
      setStatus(Array.isArray(items) && items.length === 0 ? 'empty' : 'success');
    } catch (error) {
      setOutput(JSON.stringify({ error: error.message }, null, 2));
      setStatus('error');
    } finally {
      setMs(Math.round(performance.now() - startedAt));
    }
  }

  function clearOutput() {
    setOutput('');
    setStatus('idle');
    setMs(null);
    setRequestPath('/api/games');
  }

  const statusLabel = {
    idle: 'idle',
    loading: 'loading',
    success: 'success',
    empty: 'empty',
    error: 'error',
  }[status];

  return (
    <section className="api-lab-page">
      <h1 className="api-lab-title">API Lab</h1>
      <p className="api-lab-description">
        กดปุ่มเพื่อดูข้อมูลเกมจาก Go API และเปรียบเทียบ JSON ดิบกับข้อมูลที่ frontend แปลงแล้ว
      </p>

      <div className="api-lab-form">
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          aria-label="ค้นหาชื่อเกม"
          placeholder="ชื่อเกม เช่น Grand Theft Auto V"
          className="api-lab-input"
        />
        <button
          type="button"
          disabled={status === 'loading'}
          onClick={() => run(searchPath, () => apiFetch(searchPath))}
          className="api-lab-submit"
        >
          ดู JSON ดิบ
        </button>
        <button
          type="button"
          disabled={status === 'loading'}
          onClick={() => run(searchPath, () => searchGames(query.trim()))}
          className="api-lab-mapped"
        >
          ผ่าน fromIGDB()
        </button>
      </div>

      <div className="api-lab-extra-actions">
        <button
          type="button"
          disabled={status === 'loading'}
          onClick={() => run('/api/games', () => getGames())}
          className="api-lab-clear"
        >
          getGames() · เกมยอดนิยม
        </button>
        <button
          type="button"
          onClick={clearOutput}
          className="api-lab-clear-text"
        >
          ล้างผลลัพธ์
        </button>
        <span className="api-lab-note">
          Browser เรียก Go API; IGDB credentials อยู่ฝั่ง backend
        </span>
      </div>

      <p className="api-lab-request">
        <span>GET</span>
        <code>{requestPath}</code>
      </p>

      <section className="api-lab-response" aria-live="polite" aria-label="API response">
        <div className="api-lab-response-header">
          <span className="api-lab-response-label">สถานะ</span>
          <span className={`api-lab-status is-${status}`}>{statusLabel}</span>
          {ms !== null && <span className="api-lab-response-time">{ms} ms</span>}
        </div>
        <pre className="api-lab-json">
          {output || 'ยังไม่ได้ส่ง request'}
        </pre>
      </section>
    </section>
  );
}
