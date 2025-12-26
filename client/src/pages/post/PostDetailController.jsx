import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useIntlayer } from 'react-intlayer';
import usePost from '@hooks/queries/usePost';
import useFeedHome from '@hooks/queries/useFeedHome';
import useToggleLike from '@hooks/mutations/useToggleLike';
import useToggleSave from '@hooks/mutations/useToggleSave';
import useRepost from '@hooks/mutations/useRepost';
import useDeletePost from '@hooks/mutations/useDeletePost';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import useRequireAuth from '@hooks/useRequireAuth';
import { PostCard } from '@/components/post/PostCard';
import FeedPostSkeleton from '@components/feed/FeedPostSkeleton';
import { Loading, ErrorDisplay } from '@components/common';

/**
 * Post detail controller - shows a featured post with comments auto-expanded,
 * followed by the regular home feed
 */
export default function PostDetailController() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { content } = useIntlayer('feedHome');

  // Fetch the featured post
  const { 
    data: featuredPost, 
    isLoading: isLoadingPost, 
    isError: isErrorPost,
    error: errorPost 
  } = usePost(postId);

  // Fetch the regular home feed
  const { 
    data: feedData, 
    fetchNextPage, 
    hasNextPage, 
    isLoading: isLoadingFeed,
    isFetchingNextPage 
  } = useFeedHome();

  const [expandedComments, setExpandedComments] = useState({ [postId]: true });
  const [optimisticLikes, setOptimisticLikes] = useState({});
  const [optimisticSaves, setOptimisticSaves] = useState({});

  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const repost = useRepost();
  const deletePost = useDeletePost();
  const { requireAuth } = useRequireAuth();

  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage
  });

  const handleLike = (postIdToLike, currentLiked, currentCount) => {
    requireAuth(() => {
      setOptimisticLikes(prev => ({
        ...prev,
        [postIdToLike]: {
          isLiked: !currentLiked,
          count: currentLiked ? currentCount - 1 : currentCount + 1
        }
      }));

      toggleLike.mutate(
        { postId: postIdToLike, isCurrentlyLiked: currentLiked },
        {
          onError: () => {
            setOptimisticLikes(prev => {
              const { [postIdToLike]: _, ...rest } = prev;
              return rest;
            });
            toast.error(content.errorLikingPost);
          }
        }
      );
    });
  };

  const handleSave = (postIdToSave, currentSaved) => {
    requireAuth(() => {
      setOptimisticSaves(prev => ({
        ...prev,
        [postIdToSave]: { isSaved: !currentSaved }
      }));

      toggleSave.mutate(
        { postId: postIdToSave, isCurrentlySaved: currentSaved },
        {
          onSuccess: () => {
            toast.success(currentSaved ? content.postUnsaved : content.postSaved);
          },
          onError: () => {
            setOptimisticSaves(prev => {
              const { [postIdToSave]: _, ...rest } = prev;
              return rest;
            });
            toast.error(content.errorSavingPost);
          }
        }
      );
    });
  };

  const handleCommentToggle = (postIdToToggle) => {
    requireAuth(() => {
      setExpandedComments(prev => ({
        ...prev,
        [postIdToToggle]: !prev[postIdToToggle]
      }));
    });
  };

  const handleRepost = (postIdToRepost) => {
    repost.mutate(
      { postId: postIdToRepost, repostComment: null },
      {
        onSuccess: () => toast.success(content.postReposted),
        onError: () => toast.error(content.errorRepostingPost)
      }
    );
  };

  const handleShare = (postIdToShare) => {
    const url = `${window.location.origin}/posts/${postIdToShare}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success(content.linkCopied))
      .catch(() => toast.error(content.errorCopyingLink));
  };

  const handleDelete = (postIdToDelete) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(postIdToDelete, {
        onSuccess: () => {
          toast.success('Post deleted successfully');
          navigate('/'); // Redirect to home after deleting featured post
        },
        onError: () => {
          toast.error('Failed to delete post');
        }
      });
    }
  };

  // Filter out the featured post from feed
  const feedPosts = feedData?.pages.flatMap(page => 
    page.data.posts.filter(post => post._id !== postId)
  ) ?? [];

  if (isLoadingPost) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <FeedPostSkeleton />
      </div>
    );
  }

  if (isErrorPost) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ErrorDisplay 
          message={errorPost?.response?.data?.error?.message || 'Failed to load post'}
          onRetry={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Featured post with comments auto-expanded */}
      {featuredPost && (
        <div className="mb-6">
          <PostCard
            post={featuredPost}
            onLike={() => handleLike(featuredPost._id, featuredPost.isLiked, featuredPost.likesCount)}
            onRepost={() => handleRepost(featuredPost._id)}
            onShare={() => handleShare(featuredPost._id)}
            onCommentToggle={handleCommentToggle}
            onSave={() => handleSave(featuredPost._id, featuredPost.isSaved)}
            onDelete={handleDelete}
            isCommentsExpanded={expandedComments[featuredPost._id]}
            optimisticLikes={optimisticLikes}
            optimisticSaves={optimisticSaves}
          />
        </div>
      )}

      {/* Divider */}
      {featuredPost && feedPosts.length > 0 && (
        <div className="border-t-2 border-neutral-200 mb-6 pt-6">
          <h2 className="text-heading-5 text-neutral-700 mb-4">More from your feed</h2>
        </div>
      )}

      {/* Regular feed (excluding featured post) */}
      {isLoadingFeed && feedPosts.length === 0 && (
        <>
          <FeedPostSkeleton />
          <FeedPostSkeleton />
        </>
      )}

      {feedPosts.map(post => (
        <PostCard
          key={post._id}
          post={post}
          onLike={() => handleLike(post._id, post.isLiked, post.likesCount)}
          onRepost={() => handleRepost(post._id)}
          onShare={() => handleShare(post._id)}
          onCommentToggle={handleCommentToggle}
          onSave={() => handleSave(post._id, post.isSaved)}
          onDelete={handleDelete}
          isCommentsExpanded={expandedComments[post._id]}
          optimisticLikes={optimisticLikes}
          optimisticSaves={optimisticSaves}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && <Loading />}
      </div>
    </div>
  );
}
