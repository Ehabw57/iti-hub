import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useIntlayer } from "react-intlayer";
import { useAuthStore } from "@store/auth";
import PostComposerModal from "@components/post/PostComposerModal";
import PostComposerTrigger from "@components/feed/PostComposerTrigger";
import FeedRightRail from "@components/feed/FeedRightRail";
import useRequireAuth from "@hooks/useRequireAuth";

/**
 * Feed layout — center feed column with inline composer trigger + right rail.
 * Matches /screens home feed: composer card, post stream, trending sidebar.
 */
export default function FeedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const content = useIntlayer('feedHome');
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
  ];

  const handleTabClick = (path, isPublic) => {
    if (!isPublic && !isAuthenticated) {
      requireAuth(() => navigate(path));
    } else {
      navigate(path);
    }
  };

  const handleCreatePost = () => {
    requireAuth(() => setShowComposer(true));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 flex gap-6 justify-center">
        {/* Center column */}
        <div className="w-full max-w-2xl min-w-0 flex flex-col gap-4">
          {/* Slim segmented tabs */}
          <div className="flex gap-1 bg-neutral-100 border border-outline rounded-full p-1 shadow-elevation-1 self-start">
            {tabs.map((tab) => {
              if (!(tab.public || isAuthenticated)) return null;
              const isActive = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  type="button"
                  onClick={() => handleTabClick(tab.path, tab.public)}
                  className={`px-4 py-1.5 text-body-2 font-semibold rounded-full transition-colors ${
                    isActive
                      ? "bg-primary-600 text-white"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Inline composer trigger (home only) */}
          {location.pathname === "/" && (
            <PostComposerTrigger onCreatePost={handleCreatePost} />
          )}

          {/* Content - key forces remount on route change */}
          <Outlet key={location.pathname} />
        </div>

        {/* Right rail */}
        <FeedRightRail />
      </div>

      {/* Modals */}
      <PostComposerModal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
      />
    </div>
  );
}
