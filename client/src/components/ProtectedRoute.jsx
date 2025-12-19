import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/auth.js';

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
