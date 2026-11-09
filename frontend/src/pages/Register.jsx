import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAPI } from '../api/client';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await fetchAPI('/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#151515] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e5b04a] to-transparent opacity-70"></div>

        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1b1b] border border-white/10 text-[11px] font-mono text-[#e5b04a]">
            <span>01</span> JOIN GAMEHUB
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create Account<span className="text-[#e5b04a]">.</span>
          </h1>
          <p className="text-xs text-gray-400">สมัครสมาชิกเพื่อเริ่มให้คะแนนและเขียนรีวิวเกม</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="gamer123"
              required
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e5b04a] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e5b04a] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e5b04a] transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition shadow-lg shadow-white/5 disabled:opacity-50 mt-4"
          >
            {isLoading ? 'กำลังสร้างบัญชี...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
          มีบัญชีสมาชิกอยู่แล้ว?{' '}
          <Link to="/login" className="text-[#e5b04a] font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}