import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

export default function RequireRole({ role }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user || user.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
}