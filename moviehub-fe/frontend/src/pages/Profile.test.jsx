import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../auth/AuthContext';
import Profile from './Profile';
import { changePassword } from '../api/backend';

jest.mock('../api/backend');

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('gamereview.token', 'member-token');
  localStorage.setItem('gamereview.member', JSON.stringify({ id: 5, email: 'player@example.com', displayName: 'Player', role: 'member' }));
});

test('profile shows member details and submits password change to Go with auth token', async () => {
  const user = userEvent.setup();
  changePassword.mockResolvedValue(null);
  render(<AuthProvider><Profile /></AuthProvider>);

  expect(screen.getByText('player@example.com')).toBeInTheDocument();
  await user.type(screen.getByPlaceholderText('รหัสผ่านปัจจุบัน'), 'old-password');
  await user.type(screen.getByPlaceholderText(/รหัสผ่านใหม่/), 'new-password');
  await user.click(screen.getByRole('button', { name: 'บันทึกรหัสผ่านใหม่' }));

  expect(changePassword).toHaveBeenCalledWith('old-password', 'new-password', 'member-token');
  expect(await screen.findByRole('status')).toHaveTextContent('เปลี่ยนรหัสผ่านแล้ว');
});
