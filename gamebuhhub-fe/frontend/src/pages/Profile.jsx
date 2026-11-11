import { useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { changePassword } from '../api/backend';

export default function Profile() {
  const { member, token, updateMember } = useAuth();
  const fileInputRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setAvatarMessage('');
    setAvatarError('');

    if (!file.type.startsWith('image/')) {
      setAvatarError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAvatarError('ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ไม่เกิน 8 MB');
      return;
    }

    setSavingAvatar(true);

    try {
      const image = await createImageBitmap(file);
      const maxSize = 256;
      const scale = Math.min(
        1,
        maxSize / Math.max(image.width, image.height),
      );

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('ไม่สามารถประมวลผลรูปภาพได้');
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close?.();

      updateMember({
        avatarUrl: canvas.toDataURL('image/jpeg', 0.82),
      });

      setAvatarMessage('อัปเดตรูปโปรไฟล์แล้ว');
    } catch (err) {
      setAvatarError(err.message || 'อัปเดตรูปโปรไฟล์ไม่สำเร็จ');
    } finally {
      setSavingAvatar(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      await changePassword(currentPassword, newPassword, token);
      setMessage('เปลี่ยนรหัสผ่านแล้ว');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  const displayName = member?.displayName || 'Member';
  const avatar = member?.avatarUrl || member?.avatar || member?.photoURL;

  return (
    <section className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold">โปรไฟล์</h1>

      <div className="my-6 flex flex-col items-center gap-4 rounded-xl border border-slate-700 bg-[#202024] p-6 text-center sm:flex-row sm:text-left">
        {avatar ? (
          <img
            src={avatar}
            alt={`รูปโปรไฟล์ของ ${displayName}`}
            className="h-24 w-24 shrink-0 rounded-full border border-slate-600 object-cover"
          />
        ) : (
          <div
            aria-label="รูปโปรไฟล์เริ่มต้น"
            className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-slate-700 text-3xl font-semibold text-white"
          >
            {displayName.trim().charAt(0).toUpperCase() || 'G'}
          </div>
        )}
        <div>
          <h2 className="font-semibold">รูปโปรไฟล์</h2>
          <p className="mt-1 text-sm text-slate-400">
            เลือกรูปภาพขนาดไม่เกิน 8 MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="sr-only"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={savingAvatar}
            className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-wait disabled:opacity-60"
          >
            {savingAvatar ? 'กำลังอัปโหลด…' : 'เลือกรูปโปรไฟล์'}
          </button>

          {avatarMessage && (
            <p role="status" className="mt-2 text-sm text-emerald-400">
              {avatarMessage}
            </p>
          )}

          {avatarError && (
            <p role="alert" className="mt-2 text-sm text-red-400">
              {avatarError}
            </p>
          )}
        </div>
      </div>

      <dl className="my-6 space-y-3 rounded-xl border border-slate-700 bg-[#202024] p-5">
        <div>
          <dt className="text-sm text-slate-400">ชื่อที่แสดง</dt>
          <dd className="font-medium">{member?.displayName}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-400">อีเมล</dt>
          <dd className="font-medium">{member?.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-400">ประเภทบัญชี</dt>
          <dd className="font-medium">{member?.role}</dd>
        </div>
      </dl>

      <h2 className="mb-3 text-lg font-medium">เปลี่ยนรหัสผ่าน</h2>

      <form onSubmit={submit} className="space-y-3">
        <input
          required
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="รหัสผ่านปัจจุบัน"
          className="w-full rounded-lg border border-slate-700 bg-[#202024] px-3 py-2.5 text-slate-100 placeholder:text-slate-400"
        />

        <input
          required
          minLength={8}
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
          className="w-full rounded-lg border border-slate-700 bg-[#202024] px-3 py-2.5 text-slate-100 placeholder:text-slate-400"
        />

        <button
          disabled={saving}
          className="rounded-lg bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่านใหม่'}
        </button>

        {message && (
          <p role="status" className="text-emerald-400">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="text-red-400">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
