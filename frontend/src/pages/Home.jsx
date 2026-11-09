import { useState, useEffect } from 'react';
import { fetchAPI } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorAlert from '../components/ui/ErrorAlert';

export default function Home() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    fetchAPI('/games')
      .then((data) => {
        setGames(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const features = [
    {
      num: '01',
      title: 'IGDB Catalog Proxy',
      desc: 'ดึงข้อมูลเกม 200,000+ เกมจาก IGDB ผ่าน Go Backend Proxy ป้องกัน API Key รั่วไหล',
      code: `// Go Backend Proxy Handler
func GetGames(c *gin.Context) {
    req, _ := http.NewRequest("POST", "https://api.igdb.com/v4/games", body)
    req.Header.Set("Client-ID", os.Getenv("TWITCH_CLIENT_ID"))
    // Safe & Fast JSON Proxying
}`
    },
    {
      num: '02',
      title: 'JWT Authentication',
      desc: 'ระบบสิทธิ์การใช้งานแบบ Role-Based (Guest, Member, Admin) พร้อม Token Validation',
      code: `// React Router Guard
export default function ProtectedRoute() {
    const { user } = useAuth();
    return user ? <Outlet /> : <Navigate to="/login" />;
}`
    },
    {
      num: '03',
      title: 'Supabase Data Persistence',
      desc: 'จัดเก็บข้อมูลสมาชิกและรายการรีวิวเกมอย่างปลอดภัยบน Supabase PostgreSQL',
      code: `CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    game_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL
);`
    }
  ];

  const faqs = [
    { q: "ทำไมต้องยิง IGDB API ผ่าน Go Backend?", a: "เพื่อป้องกัน Twitch Client Secret และ API Key รั่วไหลทางฝั่ง Frontend และช่วยทำ Caching ข้อมูล" },
    { q: "ระบบจัดการสิทธิ์แบ่งอย่างไร?", a: "Guest ดูหน้าแรกและรีวิวได้, Member เขียนและแก้ไขรีวิวตนเองได้, Admin มีสิทธิ์ลบรีวิวและจัดการสมาชิก" },
    { q: "ตาราง Database บน Supabase จัดเก็บอะไรบ้าง?", a: "เก็บข้อมูล users (รหัสผ่านเข้ารหัสด้วย bcrypt) และข้อมูล reviews ที่ผูกกับ game_id ของ IGDB" }
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white font-sans antialiased selection:bg-[#e5b04a] selection:text-black">
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 border-b border-white/10 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1b1b] border border-white/10 text-[11px] font-semibold uppercase tracking-wider text-[#e5b04a]">
              <span>★</span> Term Project BE-FE Architecture
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
              Explore 200,000+ Games.<br />
              <span className="text-gray-500 font-medium">Review, Rate & Build Your Backlog.</span>
            </h1>

            <p className="text-base text-gray-400 max-w-xl leading-relaxed">
              แพลตฟอร์มรีวิวเกมระดับ Full-Stack ขับเคลื่อนด้วย React Frontend, Go API Proxy และ Supabase PostgreSQL
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#games"
                className="px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition shadow-lg shadow-white/5"
              >
                Browse Games ↓
              </a>
              <a
                href="#features"
                className="px-6 py-3 rounded-full bg-[#1b1b1b] border border-white/10 text-gray-300 font-semibold text-sm hover:border-white/20 hover:text-white transition"
              >
                System Architecture
              </a>
            </div>
          </div>

          {/* Right Column Interactive Card Stack */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto w-full max-w-md bg-[#151515] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs font-mono text-gray-400">STATUS: ONLINE</span>
                </div>
                <span className="text-[10px] font-mono bg-[#e5b04a]/10 text-[#e5b04a] px-2 py-0.5 rounded border border-[#e5b04a]/20">
                  JWT ACTIVE
                </span>
              </div>

              {/* Mockup Game Card inside Hero */}
              <div className="bg-[#1b1b1b] border border-white/10 rounded-xl p-4 flex gap-4 items-center">
                <div className="w-16 h-20 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow">
                  IGDB
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Elden Ring</h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">Action RPG set in Lands Between</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-bold">★ 4.9</span>
                    <span className="text-[10px] text-gray-500">Go Backend Proxy</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1b1b1b]/50 border border-white/5 rounded-xl p-3 text-xs text-gray-400 font-mono">
                $ fetch('/api/games') &rarr; Status 200 OK
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Tech Strip */}
      <section className="py-6 border-b border-white/10 bg-[#151515]/50 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-gray-400">
          <span className="text-[#e5b04a] font-bold tracking-widest uppercase">TECH STACK</span>
          <div className="flex items-center gap-8">
            <span className="hover:text-white transition">REACT 18</span>
            <span className="hover:text-white transition">GO (GIN)</span>
            <span className="hover:text-white transition">SUPABASE POSTGRES</span>
            <span className="hover:text-white transition">IGDB API</span>
            <span className="hover:text-white transition">TAILWIND CSS</span>
          </div>
        </div>
      </section>

      {/* 01 · Game Reviews Section */}
      <section id="games" className="py-20 border-b border-white/10 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-[#e5b04a] text-black font-bold px-2 py-0.5 rounded">01</span>
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">GAME CATALOG</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight">
            Featured Games Catalog <span className="text-gray-500 font-normal">from IGDB Proxy</span>
          </h2>

          {/* UI States handling (Loading / Error / Empty / Success) */}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorAlert message={error} />}
          {!isLoading && !error && games.length === 0 && <EmptyState message="ไม่พบข้อมูลเกมในระบบ" />}

          {!isLoading && !error && games.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-[#151515] border border-white/10 rounded-2xl overflow-hidden hover:border-[#e5b04a]/50 transition group"
                >
                  {game.cover?.url ? (
                    <img
                      src={game.cover.url.replace('t_thumb', 't_cover_big')}
                      alt={game.name}
                      className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-56 bg-[#1b1b1b] flex items-center justify-center text-gray-600 font-mono text-sm">
                      No Cover Image
                    </div>
                  )}
                  <div className="p-6 space-y-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-[#e5b04a] transition">
                      {game.name}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                      {game.summary || 'ไม่มีคำอธิบายข้อมูลเกม'}
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
                      <span className="text-gray-500 font-mono">ID: #{game.id}</span>
                      <button className="text-[#e5b04a] font-semibold hover:underline">
                        Write Review &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 02 · Features Architecture */}
      <section id="features" className="py-20 border-b border-white/10 px-6 bg-[#151515]/30">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-[#e5b04a] text-black font-bold px-2 py-0.5 rounded">02</span>
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">ARCHITECTURE</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Feature Tabs */}
            <div className="lg:col-span-5 space-y-4">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`p-5 rounded-2xl border transition cursor-pointer ${
                    activeTab === idx
                      ? 'bg-[#151515] border-[#e5b04a] shadow-lg'
                      : 'bg-[#151515]/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-[#e5b04a] font-bold">{feat.num}</span>
                    <h4 className="font-bold text-white text-base">{feat.title}</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* Right Code Viewer */}
            <div className="lg:col-span-7 bg-[#151515] border border-white/10 rounded-2xl p-6 font-mono text-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 text-gray-400">
                <span>{features[activeTab].title} Snippet</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white">READY</span>
              </div>
              <pre className="text-emerald-400 overflow-x-auto leading-relaxed">
                <code>{features[activeTab].code}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 03 · FAQ Section */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-[#e5b04a] text-black font-bold px-2 py-0.5 rounded">03</span>
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">FAQ</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight">Good to know.</h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#151515] border border-white/10 rounded-2xl p-6 space-y-2">
                <h4 className="font-bold text-white text-base flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-[#e5b04a] font-mono text-sm">+</span>
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed pt-2 border-t border-white/5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Graphic Signature */}
      <footer className="border-t border-white/10 py-12 px-6 bg-[#0c0c0c] overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500">
          <div>
            <span className="font-bold text-white">GameHub Project</span> &mdash; React + Go + Supabase
          </div>
          <a href="#" className="hover:text-white transition">Back to Top &uarr;</a>
        </div>
        <div className="mt-8 text-center text-[70px] sm:text-[120px] font-black text-white/[0.03] tracking-widest leading-none select-none pointer-events-none">
          GAMEHUB
        </div>
      </footer>
    </div>
  );
}