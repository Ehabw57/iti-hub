import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@store/auth';

export default function PublicRoute() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
