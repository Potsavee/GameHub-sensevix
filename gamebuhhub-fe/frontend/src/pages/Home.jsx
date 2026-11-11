import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGames, getGameScreenshots } from '../api/backend';
import GameActions from '../components/GameActions';
import GameCard from '../components/GameCard';

const FEATURED_LIMIT = 6;
const RANDOM_PICKS_LIMIT = 4;
const ROTATE_INTERVAL = 6000;

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Home() {
  const [allGames, setAllGames] = useState([]);
  const [picks, setPicks] = useState([]);
  const [randomPicks, setRandomPicks] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [status, setStatus] = useState('loading');
  const [mediaReady, setMediaReady] = useState(false);
  const [heroImage, setHeroImage] = useState('');
  const mediaCache = useRef({});

  const preloadScreenshot = useCallback(game => {
    const cachedEntry = mediaCache.current[game.id];
    if (cachedEntry) return cachedEntry.promise;

    const entry = { url: '', image: null, promise: null };
    entry.promise = getGameScreenshots(game.id)
      .then(screenshots => {
        const url = screenshots.map(item => item.url).find(Boolean) || '';
        if (!url) return '';

        return new Promise(resolve => {
          const image = new Image();
          entry.image = image;
          image.onload = () => resolve(url);
          image.onerror = () => resolve('');
          image.src = url;
        });
      })
      .then(url => {
        entry.url = url;
        return url;
      })
      .catch(() => {
        entry.url = '';
        return '';
      });

    mediaCache.current[game.id] = entry;
    return entry.promise;
  }, []);

  useEffect(() => {
    let active = true;
    getGames()
      .then(games => {
        if (!active) return;
        setAllGames(games);
        setPicks(shuffle(games).slice(0, FEATURED_LIMIT));
        setRandomPicks(shuffle(games).slice(0, RANDOM_PICKS_LIMIT));
        setStatus('success');
      })
      .catch(() => {
        if (active) {
          setPicks([]);
          setStatus('error');
        }
      });
    return () => { active = false; };
  }, []);

  const activeGame = picks[activeIndex];

  function refreshRandomPicks() {
    setRandomPicks(shuffle(allGames).slice(0, RANDOM_PICKS_LIMIT));
  }

  useEffect(() => {
    if (!picks.length) return undefined;

    let active = true;
    setMediaReady(false);

    // Load the first hero image first so it appears as soon as possible.
    // Warm the remaining screenshot images in the background before rotating.
    preloadScreenshot(picks[0])
      .then(() => Promise.all(picks.slice(1).map(preloadScreenshot)))
      .then(() => {
        if (active) setMediaReady(true);
      });

    return () => { active = false; };
  }, [picks, preloadScreenshot]);

  useEffect(() => {
    if (!activeGame) return undefined;

    let active = true;
    const cachedEntry = mediaCache.current[activeGame.id];
    setHeroImage(cachedEntry?.url || '');

    preloadScreenshot(activeGame).then(url => {
      if (active) setHeroImage(url);
    });

    return () => { active = false; };
  }, [activeGame, preloadScreenshot]);

  useEffect(() => {
    if (picks.length < 2 || !mediaReady) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % picks.length);
    }, ROTATE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [picks.length, mediaReady, timerKey]);

  function selectGame(index) {
    setActiveIndex(index);
    setTimerKey(key => key + 1);
  }

  return (
    <>
    <div className="home-page">
      <section className="home-featured" aria-label="เกมแนะนำ">
        <div className="home-featured-heading">
          <div>
            <p className="home-featured-eyebrow">DISCOVER YOUR NEXT GAME</p>
            <h1>Recommended games</h1>
          </div>
          <Link to="/games" className="home-all-games">ดูเกมทั้งหมด <span aria-hidden="true">↗</span></Link>
        </div>

        {status === 'loading' && (
          <div className="home-featured-state" role="status">กำลังโหลดเกมแนะนำ…</div>
        )}
        {status === 'error' && (
          <div className="home-featured-state" role="alert">โหลดเกมแนะนำไม่สำเร็จ ลองค้นหาเกมที่หน้าเกม</div>
        )}
        {status === 'success' && picks.length === 0 && (
          <div className="home-featured-state">ยังไม่มีเกมแนะนำ</div>
        )}

        {status === 'success' && activeGame && (
          <div className="featured-carousel">
            <article className="featured-hero" aria-live="polite">
              <div
                key={activeGame.id}
                className="featured-hero-image"
                aria-hidden="true"
                style={{ backgroundImage: heroImage
                  ? `linear-gradient(90deg, rgba(8, 8, 10, .94) 0%, rgba(8, 8, 10, .72) 37%, rgba(8, 8, 10, .08) 78%), linear-gradient(0deg, rgba(8, 8, 10, .82), transparent 58%), url("${heroImage}")`
                  : 'linear-gradient(135deg, #22232a, #101014 65%)' }}
              />
              <div className="featured-hero-content">
                <p className="featured-tag">FEATURED GAME</p>
                <h2>{activeGame.title}</h2>
                <p className="featured-game-meta">
                  {[activeGame.genre, activeGame.year, activeGame.rating != null && `★ ${activeGame.rating}/10`]
                    .filter(Boolean).join(' · ') || 'ค้นพบเกมนี้จากคลัง IGDB'}
                </p>
                <p className="featured-game-description">{activeGame.detail || 'ดูรายละเอียดเกมและรีวิวจากสมาชิก GameReview'}</p>
                <div className="featured-actions">
                  <Link to={`/games/${activeGame.id}`} className="featured-play-button">ดูรายละเอียดเกม <span aria-hidden="true">↗</span></Link>
                  <GameActions gameId={activeGame.id} />
                </div>
              </div>
              <div className="featured-progress-track" aria-hidden="true">
                <span
                  key={activeGame.id}
                  className={`featured-progress${mediaReady ? ' is-running' : ''}`}
                />
              </div>
            </article>

            <aside className="featured-game-list" aria-label="เลือกเกมแนะนำ">
              {picks.map((game, index) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => selectGame(index)}
                  disabled={!mediaReady}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  className={`featured-game-option${index === activeIndex ? ' is-active' : ''}`}
                >
                  {game.poster
                    ? <img src={game.poster} alt="" loading="lazy" />
                    : <span className="featured-game-placeholder" aria-hidden="true">🎮</span>}
                  <span className="featured-game-option-title">{game.title}</span>
                </button>
              ))}
            </aside>
          </div>
        )}
      </section>
    </div>

    <section className="random-recommendations" aria-labelledby="random-recommendations-title">
      <div className="random-recommendations-inner">
        <div className="random-recommendations-heading">
          <div>
            <h2 id="random-recommendations-title">Game Randomizer</h2>
            <p>ไม่รู้จะเล่นอะไร? ลองเล่นเกมที่สุ่มเลือกมาจาก IGDB</p>
          </div>
          <button
            type="button"
            onClick={refreshRandomPicks}
            disabled={status !== 'success' || allGames.length === 0}
            className="random-refresh-button"
          >
            <span aria-hidden="true">⟳</span> Reroll
          </button>
        </div>

        {status === 'loading' && <p className="random-picks-state" role="status">กำลังโหลดเกม…</p>}
        {status === 'error' && <p className="random-picks-state" role="alert">โหลดเกมไม่สำเร็จ</p>}
        {status === 'success' && randomPicks.length > 0 && (
          <div className="random-recommendations-grid">
            {randomPicks.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </section>
    </>
  );
}
