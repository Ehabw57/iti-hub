import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '@/layout/layout';
import FeedLayout from '@/layout/FeedLayout';
import ProtectedRoute from '@components/routes/ProtectedRoute';
import PublicRoute from '@components/routes/PublicRoute';
import AuthLoginController from '@pages/auth/AuthLoginController';
import RegisterController from '@pages/auth/RegisterController';
import PasswordResetRequestController from '@pages/auth/PasswordResetRequestController';
import PasswordResetConfirmController from '@pages/auth/PasswordResetConfirmController';
import FeedHomeController from '@pages/feed/FeedHomeController';
import FeedFollowingController from '@pages/feed/FeedFollowingController';
import FeedTrendingController from '@pages/feed/FeedTrendingController';
import SavedPostsController from '@pages/feed/SavedPostsController';
import PostDetailController from '@pages/post/PostDetailController';

// Placeholder components for routes not yet implemented
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
      // Feed routes with FeedLayout
      {
        element: <FeedLayout />,
        children: [
          {
            path: '/',
            element: <FeedHomeController />,
          },
          {
            path: '/feed/trending',
            element: <FeedTrendingController />,
          },
          {
            path: '/posts/:postId',
            element: <PostDetailController />,
          },
          // Protected feed routes
          {
            element: <ProtectedRoute />,
            children: [
              {
                path: '/feed/following',
                element: <FeedFollowingController />,
              },
              {
                path: '/saved',
                element: <SavedPostsController />,
              },
            ],
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
