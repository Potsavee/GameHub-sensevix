// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useAuth } from '../auth/AuthContext';
import { fetchAPI } from '../api/client';
import Profile from './Profile';

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../api/client', () => ({ fetchAPI: vi.fn() }));

describe('Profile password form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { username: 'testuser', email: 'test@example.com', role: 'member' },
    });
  });

  afterEach(cleanup);

  const fillPasswordFields = (newPassword, confirmPassword = newPassword) => {
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'old-password' },
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: newPassword },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: confirmPassword },
    });
  };

  it('does not send a request when confirmation does not match', async () => {
    render(<Profile />);
    fillPasswordFields('new-password', 'different-password');
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน'
    );
    expect(fetchAPI).not.toHaveBeenCalled();
  });

  it('sends the password change request and clears fields on success', async () => {
    fetchAPI.mockResolvedValue({});
    render(<Profile />);
    fillPasswordFields('new-password');
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(await screen.findByRole('status')).toHaveTextContent('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว');
    expect(fetchAPI).toHaveBeenCalledWith('/change-password', {
      method: 'PUT',
      body: JSON.stringify({
        old_password: 'old-password',
        new_password: 'new-password',
      }),
    });
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toHaveValue('');
      expect(screen.getByLabelText('New Password')).toHaveValue('');
      expect(screen.getByLabelText('Confirm New Password')).toHaveValue('');
    });
  });

  it('shows backend errors without clearing the entered values', async () => {
    fetchAPI.mockRejectedValue(new Error('เปลี่ยนรหัสผ่านไม่ได้'));
    render(<Profile />);
    fillPasswordFields('new-password');
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('เปลี่ยนรหัสผ่านไม่ได้');
    expect(screen.getByLabelText('Current Password')).toHaveValue('old-password');
  });
});
