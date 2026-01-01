import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "@/layout/layout";
import AuthLayout from "@/layout/AuthLayout";
import ProtectedRoute from "@components/routes/ProtectedRoute";
import PublicRoute from "@components/routes/PublicRoute";
import AuthLoginController from "@pages/auth/AuthLoginController";
import RegisterController from "@pages/auth/RegisterController";
import PasswordResetRequestController from "@pages/auth/PasswordResetRequestController";
import PasswordResetConfirmController from "@pages/auth/PasswordResetConfirmController";
import EmailVerifyPage from "@pages/auth/EmailVerifyPage";
import ResendVerificationPage from "@pages/auth/ResendVerificationPage";
import FeedHomeController from "@pages/feed/FeedHomeController";
import FeedFollowingController from "@pages/feed/FeedFollowingController";
import FeedTrendingController from "@pages/feed/FeedTrendingController";
import SavedPostsController from "@pages/feed/SavedPostsController";
import PostDetailController from "@pages/post/PostDetailController";
import NotificationsCenterController from "@pages/notifications/NotificationsCenterController";
import ProfileController from "../pages/profile/ProfileController";
import FeedLayout from "../layout/FeedLayout";
import MessagesList from "@pages/messages/MessagesList";
import ConversationDetail from "@pages/messages/ConversationDetail";
import CommunityManagement from "@pages/community/CommunityManagement";
import UserCommunitiesController from "@pages/community/UserCommunitiesController";
import Community from "@components/community/Community";
import SearchPage from "@pages/SearchPage";
import ExploreController from "@pages/explore/ExploreController";

// Placeholder components for routes not yet implemented
const NotFoundPage = () => <div>404 - Page Not Found</div>;

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/verify-email",
        element: <EmailVerifyPage />,
      },
      {
        path: "/resend-verification",
        element: <ResendVerificationPage />,
      },
      {
        element: <PublicRoute />,
        children: [
          {
            path: "/login",
            element: <AuthLoginController />,
          },
          {
            path: "/register",
            element: <RegisterController />,
          },
          {
            path: "/password-reset/request",
            element: <PasswordResetRequestController />,
          },
          {
            path: "/password-reset/confirm",
            element: <PasswordResetConfirmController />,
          },
          {
            path: "/verify-email",
            element: <EmailVerifyPage />,
          },
          {
            path: "/resend-verification",
            element: <ResendVerificationPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        element: <FeedLayout />,
        children: [
          {
            path: "/",
            element: <FeedHomeController />,
          },
          {
            path: "/feed/trending",
            element: <FeedTrendingController />,
          },
          {
            path: "/posts/:postId",
            element: <PostDetailController />,
          },
          // Protected feed routes
          {
            element: <ProtectedRoute />,
            children: [
              {
                path: "/feed/following",
                element: <FeedFollowingController />,
              },
            ],
          },
        ],
      },
      {
        path: "/profile/:username",
        element: <ProfileController />,
      },
      {
        path: "/search",
        element: <SearchPage />,
      },
      {
        path: "/explore",
        element: <ExploreController />,
      },
      {
        path: "/community/:communityId",
        element: <Community />,
      },
      // Protected routes outside FeedLayout
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/community/:communityId/manage",
            element: <CommunityManagement />,
          },
          {
            path: "/communities",
            element: <UserCommunitiesController />,
          },
          {
            path: "/notifications",
            element: <NotificationsCenterController />,
          },
          {
            path: "/saved",
            element: <SavedPostsController />,
          },
          {
            path: "/messages",
            element: <MessagesList />,
          },
          {
            path: "/messages/:conversationId",
            element: <ConversationDetail />,
          },
        ],
      },
      // 404 route
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}

export default router;
