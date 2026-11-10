import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { changePassword } from '../api/backend';

export default function Profile() {
  const { member, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(e) {
    e.preventDefault(); setMessage(''); setError(''); setSaving(true);
    try { await changePassword(currentPassword, newPassword, token); setMessage('เปลี่ยนรหัสผ่านแล้ว'); setCurrentPassword(''); setNewPassword(''); }
    catch (err) { setError(err.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ'); }
    finally { setSaving(false); }
  }
  return <section className="mx-auto max-w-xl px-4 py-10">
    <h1 className="text-2xl font-semibold">โปรไฟล์</h1>
    <dl className="my-6 space-y-2 rounded-xl border p-5"><div><dt className="text-sm text-slate-500">ชื่อที่แสดง</dt><dd>{member?.displayName}</dd></div><div><dt className="text-sm text-slate-500">อีเมล</dt><dd>{member?.email}</dd></div><div><dt className="text-sm text-slate-500">ประเภทบัญชี</dt><dd>{member?.role}</dd></div></dl>
    <h2 className="mb-3 text-lg font-medium">เปลี่ยนรหัสผ่าน</h2>
    <form onSubmit={submit} className="space-y-3">
      <input required type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="รหัสผ่านปัจจุบัน" className="w-full rounded border px-3 py-2" />
      <input required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)" className="w-full rounded border px-3 py-2" />
      <button disabled={saving} className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50">{saving?'กำลังบันทึก…':'บันทึกรหัสผ่านใหม่'}</button>
      {message && <p role="status" className="text-emerald-700">{message}</p>}{error && <p role="alert" className="text-red-700">{error}</p>}
    </form>
  </section>;
}
