import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGames, getGameScreenshots } from '../api/backend';

const QUESTION_COUNT = 5;
const AUTO_ADVANCE_DELAY = 3000;

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function comparisonValue(game, mode) {
  // The catalog API returns IGDB ratingCount from the database. The numeric
  // rating score is only present on individual IGDB detail responses.
  const value = mode === 'rating' ? game.ratingCount : game.year;
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function findGroup(games, mode, usedGroups) {
  const eligibleGames = shuffle(games.filter(game => comparisonValue(game, mode) !== null));
  const bucketsByValue = new Map();
  eligibleGames.forEach(game => {
    const value = comparisonValue(game, mode);
    if (!bucketsByValue.has(value)) bucketsByValue.set(value, []);
    bucketsByValue.get(value).push(game);
  });
  const valueBuckets = shuffle([...bucketsByValue.values()]);
  if (valueBuckets.length < 3) return null;

  let fallbackGroup = null;
  const attempts = Math.min(40, Math.max(10, valueBuckets.length * 2));
  for (let attempt = 0; attempt < attempts; attempt++) {
    const group = shuffle(valueBuckets).slice(0, 3).map(bucket => bucket[Math.floor(Math.random() * bucket.length)]);
    const groupKey = group.map(game => game.id).sort().join(':');
    if (!fallbackGroup) fallbackGroup = { group, groupKey };
    if (!usedGroups.has(groupKey)) return { group, groupKey };
  }
  return fallbackGroup;
}

function createQuestions(games, mode) {
  const questions = [];
  const usedGroups = new Set();

  for (let index = 0; index < QUESTION_COUNT; index++) {
    const selectedGroup = findGroup(games, mode, usedGroups);
    if (!selectedGroup) break;

    const { group, groupKey } = selectedGroup;
    usedGroups.add(groupKey);
    const correctGame = group.reduce((best, game) => {
      const value = comparisonValue(game, mode);
      const bestValue = comparisonValue(best, mode);
      if (mode === 'rating') return value > bestValue ? game : best;
      return value < bestValue ? game : best;
    });

    questions.push({
      mode,
      games: group,
      correctId: correctGame.id,
    });
  }

  return questions;
}

export default function GameQuiz() {
  const [games, setGames] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [modeScreenshotPools, setModeScreenshotPools] = useState({ year: [], rating: [] });
  const [modeBackgrounds, setModeBackgrounds] = useState({ year: null, rating: null });
  const [mode, setMode] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const feedbackRef = useRef(null);

  useEffect(() => {
    let active = true;
    getGames()
      .then(result => {
        if (!active) return;
        setGames(result);
        setStatus('ready');
      })
      .catch(err => {
        if (!active) return;
        setError(err.message || 'โหลดข้อมูลเกมไม่สำเร็จ');
        setStatus('error');
      });

    return () => { active = false; };
  }, []);

  const question = questions[questionIndex];
  const isFinished = status === 'playing' && questionIndex >= questions.length;

  useEffect(() => {
    if (status !== 'playing' || selectedId === null) return undefined;

    setCountdownStarted(false);
    const frame = requestAnimationFrame(() => setCountdownStarted(true));
    const timer = window.setTimeout(() => {
      setSelectedId(null);
      setQuestionIndex(index => index + 1);
    }, AUTO_ADVANCE_DELAY);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [selectedId, status]);

  useEffect(() => {
    if (selectedId === null) return undefined;
    const frame = requestAnimationFrame(() => {
      const feedback = feedbackRef.current;
      if (!feedback) return;
      const rect = feedback.getBoundingClientRect();
      const bottomGap = 24;
      const overflow = rect.bottom - (window.innerHeight - bottomGap);
      if (overflow > 0) window.scrollBy({ top: overflow, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId]);

  useEffect(() => {
    if (status !== 'ready' || games.length === 0) return undefined;
    let active = true;
    const sample = shuffle(games.filter(game => game.id)).slice(0, 8);

    Promise.all(sample.map(async game => {
        try {
          const items = await getGameScreenshots(game.id);
          return (items || []).map(item => typeof item === 'string' ? item : item?.url).filter(Boolean);
        } catch {
          return [];
        }
      })).then(results => {
      if (!active) return;
      const images = shuffle(results.flat());
      const pools = { year: images, rating: images };
      setModeScreenshotPools(pools);
      setModeBackgrounds(Object.fromEntries(Object.keys(pools).map(modeId => {
        const index = images.length ? Math.floor(Math.random() * images.length) : 0;
        return [modeId, images.length ? { current: images[index], previous: null, index, transitioning: true } : null];
      })));
    });

    return () => { active = false; };
  }, [games, status]);

  useEffect(() => {
    if (status !== 'ready') return undefined;
    const hasAlternates = Object.values(modeScreenshotPools).some(images => images.length > 1);
    if (!hasAlternates) return undefined;

    const timer = setInterval(() => {
      setModeBackgrounds(current => {
        const next = { ...current };
        Object.entries(modeScreenshotPools).forEach(([modeId, images]) => {
          if (images.length < 2) return;
          const existing = current[modeId];
          if (!existing?.current) return;
          const currentIndex = existing.index || 0;
          let nextIndex = Math.floor(Math.random() * (images.length - 1));
          if (nextIndex >= currentIndex) nextIndex += 1;
          next[modeId] = { current: images[nextIndex], previous: existing.current, index: nextIndex, transitioning: false };
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [modeScreenshotPools, status]);

  function answer(gameId) {
    if (selectedId !== null || !question) return;
    setCountdownStarted(false);
    setSelectedId(gameId);
    if (gameId === question.correctId) setScore(current => current + 1);
  }

  function startGame(nextMode) {
    const nextQuestions = createQuestions(games, nextMode);
    if (nextQuestions.length === 0) {
      setError(nextMode === 'rating'
        ? 'เกมในคลังยังมีข้อมูล Rating ไม่พอสำหรับเปรียบเทียบ'
        : 'เกมในคลังยังมีข้อมูลปีวางจำหน่ายไม่พอสำหรับเปรียบเทียบ');
      setStatus('error');
      return;
    }
    setError('');
    setMode(nextMode);
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setScore(0);
    setSelectedId(null);
    setStatus('playing');
  }

  function playAgain() {
    const nextQuestions = createQuestions(games, mode);
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setScore(0);
    setSelectedId(null);
    setCountdownStarted(false);
    setError(nextQuestions.length ? '' : 'ข้อมูลเกมไม่เพียงพอสำหรับเริ่มเกมใหม่');
    setStatus(nextQuestions.length ? 'playing' : 'error');
  }

  function backToModes() {
    setMode(null);
    setQuestions([]);
    setQuestionIndex(0);
    setScore(0);
    setSelectedId(null);
    setCountdownStarted(false);
    setError('');
    setStatus('ready');
  }

  return (
    <main className="mx-auto max-w-[55rem] px-4 py-5 md:px-6">
      <section className="overflow-hidden rounded-2xl border border-[#3a3a3a] bg-[#202024] shadow-xl">
        <div className="border-b border-[#3a3a3a] p-4 md:p-5">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-sky-400">GameReview mini game</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Game Quiz</h1>
              <p className="mt-1.5 text-sm text-slate-400">
                {status === 'playing' ? `คะแนนปัจจุบัน ${score} / ${QUESTION_COUNT}` : 'เลือกเกมทาย 1 ใน 2 แบบ เล่นแบบละ 5 ข้อ มี 3 ตัวเลือกต่อข้อ'}
              </p>
            </div>
            {status === 'playing' && !isFinished && (
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200">
                  ข้อ {questionIndex + 1} / {QUESTION_COUNT}
                </span>
                <button
                  type="button"
                  onClick={backToModes}
                  aria-label="ออกจากเกมและกลับไปเลือกโหมด"
                  title="ออกจากเกม"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/40 text-xl font-medium text-white transition hover:border-red-400 hover:bg-red-500/15 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          {status === 'playing' && !isFinished && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800" aria-label={`ความคืบหน้า ${questionIndex + 1} จาก ${QUESTION_COUNT}`}>
              <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${((questionIndex + 1) / QUESTION_COUNT) * 100}%` }} />
            </div>
          )}
        </div>

        <div className="p-4 md:p-5">
          {status === 'loading' && <p role="status" className="py-16 text-center text-slate-400">กำลังโหลดเกม…</p>}
          {status === 'error' && <div role="alert" className="py-12 text-center"><p className="text-red-300">{error}</p>{games.length > 0 && <button type="button" onClick={backToModes} className="mt-4 rounded-lg border border-slate-600 px-4 py-2 text-slate-200 transition hover:bg-slate-700">กลับไปเลือกโหมด</button>}<Link to="/games" className="mt-4 ml-4 inline-block text-sm text-sky-400 hover:underline">ไปดูเกมทั้งหมด</Link></div>}

          {status === 'ready' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { id: 'year', title: 'Time Traveler', description: 'เลือกเกมที่วางจำหน่ายเก่าที่สุดจาก 3 เกม' },
                { id: 'rating', title: 'Rating Rumble', description: 'เลือกเกมที่มีผู้ให้คะแนนมากที่สุดจาก 3 เกม'},
                ].map(item => {
                  const background = modeBackgrounds[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => startGame(item.id)}
                      className="group relative isolate min-h-[250px] overflow-hidden rounded-xl border border-[#3a3a3a] bg-[#17171b] p-6 text-left transition hover:-translate-y-1 hover:border-[#606060]"
                    >
                      {background?.previous && <img src={background.previous} alt="" style={{ zIndex: 0 }} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${background.transitioning ? 'opacity-0' : 'opacity-100'}`} />}
                      {background?.current && <img src={background.current} alt="" onLoad={() => {
                        if (!background.previous || background.transitioning) return;
                        requestAnimationFrame(() => requestAnimationFrame(() => {
                          setModeBackgrounds(current => {
                            const entry = current[item.id];
                            if (!entry || entry.current !== background.current || !entry.previous || entry.transitioning) return current;
                            return { ...current, [item.id]: { ...entry, transitioning: true } };
                          });
                        }));
                      }} style={{ zIndex: 0 }} className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ease-in-out ${background.previous && !background.transitioning ? 'scale-105 opacity-0' : 'scale-100 opacity-100'}`} />}
                      <span aria-hidden="true" style={{ zIndex: 1, pointerEvents: 'none' }} className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35" />
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                        <span className="mt-4 block text-xl font-bold text-white drop-shadow-md">{item.title}</span>
                        <span className="mt-2 block text-sm text-slate-100 drop-shadow-md">{item.description}</span>
                        <span className="mt-5 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-sky-500">เริ่มเล่น · 5 ข้อ</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {status === 'playing' && !isFinished && question && (
            <>
              <div className="mb-4 text-center">
                <p className="text-sm text-slate-400">{question.mode === 'rating' ? 'จำนวน Rating จาก IGDB' : 'ปีที่วางจำหน่าย'}</p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  {mode === 'rating' ? 'เกมไหนมีผู้ให้ Rating มากที่สุด?' : 'เกมไหนเก่าที่สุด?'}
                </h2>
              </div>

              <div className="mx-auto grid max-w-[600px] grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {question.games.map(game => {
                  const answered = selectedId !== null;
                  const correct = game.id === question.correctId;
                  const chosenWrong = selectedId === game.id && !correct;
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => answer(game.id)}
                      disabled={answered}
                      className={`group w-[180px] max-w-full justify-self-center overflow-hidden rounded-xl border border-[#3a3a3a] text-left transition-all duration-200 ${
                        answered && correct
                          ? 'border-emerald-400 bg-emerald-950/40'
                          : chosenWrong
                            ? 'border-red-400 bg-red-950/40'
                            : answered
                              ? 'border-[#303030] bg-[#17171b] opacity-40'
                              : 'border-[#3a3a3a] bg-[#17171b] hover:-translate-y-1 hover:border-[#606060] hover:bg-[#26262a]'
                      }`}
                    >
                      <div className="w-full overflow-hidden">
                        {game.poster ? (
                          <img src={game.poster} alt="" className="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
                        ) : (
                          <div className="grid aspect-[2/3] w-full place-items-center bg-slate-800 text-6xl" aria-hidden="true">🎮</div>
                        )}
                      </div>
                      <div className={`min-h-[60px] p-2.5 ${answered && correct ? 'bg-emerald-950/40' : chosenWrong ? 'bg-red-950/40' : ''}`}>
                        <span className="block min-h-10 whitespace-normal break-words text-sm font-semibold leading-5 text-white">{game.title}</span>
                        {answered && (
                          <span className={`mt-1 block text-xs font-medium ${correct ? 'text-emerald-300' : chosenWrong ? 'text-red-300' : 'text-slate-300'}`}>
                            {mode === 'rating'
                              ? `Rating ${comparisonValue(game, mode).toLocaleString()} คน`
                              : `ปี ${comparisonValue(game, mode)}`}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedId !== null && (
                <div ref={feedbackRef} className="mt-4 rounded-xl bg-slate-800/70 p-3">
                  <p className={`font-semibold ${selectedId === question.correctId ? 'text-emerald-300' : 'text-amber-200'}`}>
                    {selectedId === question.correctId ? 'ถูกต้อง!' : 'เกือบถูกแล้ว!'}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {questionIndex === QUESTION_COUNT - 1 ? 'กำลังสรุปคะแนน…' : 'ไปข้อถัดไปอัตโนมัติ'}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700" aria-label="นับถอยหลังก่อนเปลี่ยนข้อ">
                    <div
                      className="h-full w-full rounded-full bg-sky-400"
                      style={{
                        transform: countdownStarted ? 'scaleX(0)' : 'scaleX(1)',
                        transformOrigin: 'left',
                        transition: countdownStarted ? `transform ${AUTO_ADVANCE_DELAY}ms linear` : 'none',
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {isFinished && (
            <div className="py-8 text-center">
              <h2 className="mt-4 text-2xl font-bold text-white">จบเกมแล้ว!</h2>
              <p className="mt-2 text-slate-300">คุณตอบถูก <span className="font-bold text-sky-400">{score} / {QUESTION_COUNT}</span> ข้อ</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={playAgain} className="rounded-lg bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500">เล่นโหมดนี้อีกครั้ง</button>
                <button type="button" onClick={backToModes} className="rounded-lg border border-slate-600 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-700">เลือกโหมดอื่น</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
