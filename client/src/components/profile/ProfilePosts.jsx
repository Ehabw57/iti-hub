import { useState } from 'react';
import { FaFileAlt } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useIntlayer } from 'react-intlayer';
import { useGetUserPosts } from '@hooks/queries/useUserQueries';

const ProfilePosts = ({ userId, isOwnProfile }) => {
  const content = useIntlayer('profile');
  // جلب البوستات من الـ API باستخدام userId
  const { data: postsData, isLoading } = useGetUserPosts(userId);
  const posts = postsData?.data?.posts || [];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-100 shadow-sm rounded-lg p-12">
        <div className="flex flex-col items-center justify-center">
          <AiOutlineLoading3Quarters className="w-10 h-10 text-primary-600 animate-spin mb-4" />
          <p className="text-neutral-600 dark:text-neutral-600">{content.loadingPosts}</p>
        </div>
      </div>
    );
  }

  // No Posts State
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-100 shadow-sm rounded-lg p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-100 flex items-center justify-center mb-4">
            <FaFileAlt className="w-10 h-10 text-neutral-400 dark:text-neutral-400" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-900 mb-2">
            {content.noPostsYet}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-600 max-w-sm">
            {isOwnProfile
              ? content.noPostsYetOwnMessage
              : content.noPostsYetOthersMessage}
          </p>
          {isOwnProfile && (
            <button className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
              {content.createFirstPost}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Posts Grid/List
  return (
    <div className="space-y-4">
      {/* Posts Header */}
      <div className="bg-white dark:bg-neutral-100 shadow-sm rounded-lg px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-900">
          {content.posts} ({posts.length})
        </h2>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
};

// Post Card Component
const PostCard = ({ post }) => {
  return (
    <div className="bg-white dark:bg-neutral-100 shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={post.author?.profilePicture || '/api/placeholder/40/40'}
          alt={post.author?.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-900">
            {post.author?.fullName}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            @{post.author?.username} · {formatDate(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-neutral-800 dark:text-neutral-800 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Post Image (if exists) */}
      {post.image && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={post.image}
            alt="Post"
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      {/* Post Stats */}
      <div className="flex items-center gap-6 text-neutral-600 dark:text-neutral-600 text-sm">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{post.likesCount || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>{post.commentsCount || 0}</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

export default ProfilePosts;
