import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchAPI } from '../api/client';

export default function Profile() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [isLoading, setIsLoading] = useState(false);
  const username = user?.username?.trim() || 'ผู้ใช้';
  const initials = username.slice(0, 2).toUpperCase();
  const role = user?.role === 'admin' ? 'ADMIN' : user?.role === 'member' ? 'MEMBER' : 'UNKNOWN';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', msg: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' });
      return;
    }

    if (newPassword === oldPassword) {
      setStatus({ type: 'error', msg: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน' });
      return;
    }

    setIsLoading(true);

    try {
      await fetchAPI('/change-password', {
        method: 'PUT',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      setStatus({ type: 'success', msg: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatus({
        type: 'error',
        msg: err.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ backend แล้วลองอีกครั้ง',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      {/* Profile Info Header */}
      <div className="bg-[#151515] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#e5b04a] text-black font-black text-xl flex items-center justify-center uppercase shadow-lg shadow-[#e5b04a]/10">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{username}</h1>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{user?.email || 'ไม่พบอีเมล'}</p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-mono uppercase px-3 py-1 rounded-full bg-[#1b1b1b] border border-white/10 text-[#e5b04a]">
            {role}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs font-mono">
          <div className="bg-[#1b1b1b] border border-white/5 rounded-xl p-4">
            <span className="text-gray-500 uppercase tracking-wider block mb-1">SESSION</span>
            <span className="text-emerald-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> SIGNED IN
            </span>
          </div>
          <div className="bg-[#1b1b1b] border border-white/5 rounded-xl p-4">
            <span className="text-gray-500 uppercase tracking-wider block mb-1">ROLE</span>
            <span className="text-white font-bold uppercase">{role}</span>
            <p className="text-gray-500 mt-1">การอนุญาตใช้งานต้องตรวจสอบโดย backend</p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-[#151515] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Settings</h2>
          <p className="text-xs text-gray-400 mt-1">อัปเดตรหัสผ่านใหม่สำหรับเข้าใช้งานระบบ</p>
          <p className="text-xs text-gray-500 mt-2">การเปลี่ยนรหัสผ่านจะทำงานเมื่อเชื่อมต่อ backend แล้ว</p>
        </div>

        {status.msg && (
          <div
            role={status.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`p-4 rounded-xl text-xs font-mono border flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${status.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            {status.msg}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              required
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e5b04a] transition"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              minLength={8}
              required
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e5b04a] transition"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              minLength={8}
              required
              className="w-full bg-[#1b1b1b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e5b04a] transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !oldPassword || newPassword.length < 8 || !confirmPassword}
              className="px-6 py-3 rounded-full bg-[#e5b04a] text-black font-semibold text-sm hover:bg-[#d49f39] transition shadow-lg shadow-[#e5b04a]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'กำลังอัปเดต...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}