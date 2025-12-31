import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useIntlayer } from "react-intlayer";
import Navbar from "../components/Navbar/Navbar";
import { Sidebar } from "../components/Sidebar";
import { GlobalNotificationHandler } from "../components/notifications/GlobalNotificationHandler";
import { GlobalMessagingHandler } from "../components/messaging/GlobalMessagingHandler";
import { useAuthStore } from "@store/auth";
import PostComposerModal from "@components/post/PostComposerModal";
import LoginRequiredModal from "@components/auth/LoginRequiredModal";
import useRequireAuth from "@hooks/useRequireAuth";
import sidebarContent from "@/content/sidebar/sidebar.content";

export default function Layout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { requireAuth } = useRequireAuth();

  const handleCreatePost = () => {
    requireAuth(() => setShowComposer(true));
  };


  return (
    <div className="min-h-screen max-h-screen flex flex-col bg-neutral-50">

      {/* Navbar - Full width at top, pass sidebar open handler */}
      <Navbar onOpenSidebar={() => setIsMobileMenuOpen(true)} />

      {/* Main layout container - Sidebar + Content */}
      <div className="relative flex flex-1 overflow-y-scroll ">
        {/* Sidebar */}
        <Sidebar
          mobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
          onCreatePost={handleCreatePost}
        />

        {/* Main content area */}
        <main className="flex-1">
          {/* Global notification handler - manages real-time updates across all pages */}
          {isAuthenticated && <GlobalNotificationHandler />}
          {/* Global messaging handler - manages real-time message updates across all pages */}
          {isAuthenticated && <GlobalMessagingHandler />}
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      <PostComposerModal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
      />
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
