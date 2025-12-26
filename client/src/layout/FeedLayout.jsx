import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { HiPlus, HiPencil} from "react-icons/hi2";
import { useIntlayer } from "react-intlayer";
import { useAuthStore } from "@store/auth";
import Button from "../components/common/Button";
import PostComposerModal from "@components/post/PostComposerModal";
import useRequireAuth from "@hooks/useRequireAuth";
import homeContent from "@/content/feed/home.content";

/**
 * Feed layout with tabs and create post button
 */
export default function FeedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const content = useIntlayer(homeContent.key);
  const { isAuthenticated } = useAuthStore();
  const { requireAuth } = useRequireAuth();
  const [showComposer, setShowComposer] = useState(false);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const tabs = [
    { path: "/", label: content.homeTab, public: true },
    { path: "/feed/following", label: content.followingTab, public: false },
    { path: "/feed/trending", label: content.trendingTab, public: true },
    { path: "/saved", label: content.savedTab, public: false },
  ];

  const handleTabClick = (path, isPublic) => {
    if (!isPublic && !isAuthenticated) {
      setShowLoginModal(true);
    } else {
      navigate(path);
    }
  };

  const handleCreatePost = () => {
    requireAuth(() => setShowComposer(true));
  };

  return (
    <div className="min-h-screen bg-neutral-200">
      {/* Header with tabs */}
      <div className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                return (
                  (tab.public || isAuthenticated) && (
                    <button
                      key={tab.path}
                      onClick={() => handleTabClick(tab.path, tab.public)}
                      className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        isActive
                          ? "border-primary-600 text-primary-600"
                          : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                );
              })}
            </div>

            {/* Create post button */}
            <Button
              onClick={handleCreatePost}
              variant="primary"
            >
              <HiPencil className="w-5 h-5" />
              <span className="hidden sm:inline">{content.createPost}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content - key forces remount on route change */}
      <div className="py-6">
        <Outlet key={location.pathname} />
      </div>

      {/* Modals */}
      <PostComposerModal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
      />
    </div>
  );
}
