import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '@/layout/layout';
import ProtectedRoute from '@components/routes/ProtectedRoute';
import PublicRoute from '@components/routes/PublicRoute';
import AuthLoginController from '@pages/auth/AuthLoginController';
import RegisterController from '@pages/auth/RegisterController';
import PasswordResetRequestController from '@pages/auth/PasswordResetRequestController';
import PasswordResetConfirmController from '@pages/auth/PasswordResetConfirmController';

// Placeholder components for routes not yet implemented
const HomePage = () => <div>Home Page (Protected)</div>;
const NotFoundPage = () => <div>404 - Page Not Found</div>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // Public routes - redirect to home if authenticated
      {
        element: <PublicRoute />,
        children: [
          {
            path: '/login',
            element: <AuthLoginController />,
          },
          {
            path: '/register',
            element: <RegisterController />,
          },
          {
            path: '/password-reset/request',
            element: <PasswordResetRequestController />,
          },
          {
            path: '/password-reset/confirm',
            element: <PasswordResetConfirmController />,
          },
        ],
      },
      // Protected routes - redirect to login if not authenticated
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/',
            element: <HomePage />,
          },
        ],
      },
      // 404 route
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}

export default router;
