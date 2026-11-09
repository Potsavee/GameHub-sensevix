import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import * as AuthContext from '../auth/AuthContext';

vi.mock('../auth/AuthContext');

describe('ProtectedRoute Behavior', () => {
  test('Redirect ไปยัง /login หากไม่ได้เข้าสู่ระบบ (Guest)', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Area</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('แสดงเนื้อหาเมื่อเป็นสมาชิก (Member)', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { username: 'testuser', role: 'member' },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Area</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Area')).toBeInTheDocument();
  });
});