import { useState, useRef, useEffect } from 'react';
import { 
  HiArrowLeft, 
  HiArrowTopRightOnSquare,
  HiPencilSquare,
  HiArrowUp,
  HiChatBubbleOvalLeft
} from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import useAskCommunity from '@hooks/mutations/useAskCommunity';
import { Loading } from '@components/common';
import askContent from '@/content/ask/ask.content';

// itiHub Logo Component (using brand colors)
const ItiHubLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill="var(--color-primary-500)" />
    <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fff" fontFamily="Inter, sans-serif">iti</text>
  </svg>
);

/**
 * Ask Community Page Controller
 * Reddit Answers-style interface for AI-powered community Q&A
 */
export default function AskCommunityController() {
  const content = useIntlayer(askContent.key);
  const [question, setQuestion] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const askMutation = useAskCommunity();

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !result) {
      inputRef.current.focus();
    }
  }, [result]);

  const handleSubmit = (e) => {
    e?.preventDefault();

    const q = question.trim();
    if (!q || q.length < 3) {
      toast.error(content.questionTooShort);
      return;
    }

    setSubmittedQuestion(q);
    askMutation.mutate(
      { question: q },
      {
        onSuccess: (response) => {
          if (response.success && response.data) {
            setResult(response.data);
          }
        },
        onError: (error) => {
          const errorMessage = error?.response?.data?.message || content.errorTitle;
          toast.error(errorMessage);
        }
      }
    );
  };

  const handleNewQuestion = () => {
    setResult(null);
    setQuestion('');
    setSubmittedQuestion('');
  };

  /**
   * Replace [POST_X] references with clickable links that open in new tab
   */
  const renderAnswerWithLinks = (answer, referencedPosts) => {
    if (!answer) return null;

    const parts = answer.split(/(\[POST_\d+\])/g);

    return parts.map((part, index) => {
      const match = part.match(/\[POST_(\d+)\]/);
      if (match) {
        const refId = `POST_${match[1]}`;
        const post = referencedPosts.find(p => p.referenceId === refId);
        if (post) {
          return (
            <a
              key={index}
              href={`/posts/${post._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              &quot;{post.contentPreview?.substring(0, 50)}...&quot;
            </a>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  // ============================================
  // RESULTS VIEW (after submitting a question)
  // ============================================
  if (result && !askMutation.isPending) {
    return (
      <div className="relative bg-neutral-50 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-neutral-50 border-b border-neutral-200 px-3 sm:px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
            <button
              onClick={handleNewQuestion}
              className="flex items-center gap-1 sm:gap-2 text-neutral-700 hover:text-neutral-900 transition-colors min-w-0"
            >
              <HiArrowLeft className="w-5 h-5 shrink-0" />
              <span className="text-body-2 sm:text-body-1 font-medium truncate">{submittedQuestion}</span>
            </button>
            <button
              onClick={handleNewQuestion}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-neutral-300 rounded-full text-caption sm:text-body-2 font-medium text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
            >
              <HiPencilSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{content.newQuestion}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-28 sm:pb-32">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {/* AI Answer */}
            <div className="mb-6 sm:mb-8">
              <div className="text-body-2 sm:text-body-1 text-neutral-800 leading-relaxed whitespace-pre-wrap">
                {renderAnswerWithLinks(result.answer, result.referencedPosts || [])}
              </div>
            </div>

            {/* Source Posts - Horizontal Scroll */}
            {result.referencedPosts && result.referencedPosts.length > 0 && (
              <div>
                <h3 className="text-body-2 text-neutral-600 mb-3">{content.sourcesTitle}</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide">
                  {result.referencedPosts.slice(0, 2).map((post, index) => (
                    <a
                      key={post._id}
                      href={`/posts/${post._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-56 sm:w-64 p-3 sm:p-4 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-caption text-neutral-500 truncate">
                          @{post.author?.username}
                        </span>
                      </div>
                      <p className="text-body-2 text-neutral-800 font-medium line-clamp-2 mb-3">
                        {post.contentPreview}
                      </p>
                      <div className="flex items-center gap-4 text-caption text-neutral-500">
                        <span className="flex items-center gap-1">
                          <HiArrowUp className="w-3.5 h-3.5" />
                          {post.likesCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiChatBubbleOvalLeft className="w-3.5 h-3.5" />
                          {post.commentsCount || 0}
                        </span>
                      </div>
                    </a>
                  ))}
                  {result.referencedPosts.length > 2 && (
                    <div className="shrink-0 w-20 sm:w-24 p-3 sm:p-4 bg-neutral-100 border border-neutral-200 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-heading-6 sm:text-heading-5 text-neutral-700 font-bold">+{result.referencedPosts.length - 2}</span>
                      <span className="text-caption text-neutral-600">{content.viewAll}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Fixed Bottom Input */}
        <div className="fixed bottom-0 w-full bg-neutral-50 border-t border-neutral-200 px-3 sm:px-4 py-3 sm:py-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={content.followupPlaceholder.value}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 pe-12 sm:pe-14 bg-white border border-neutral-300 rounded-full text-body-2 sm:text-body-1 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                disabled={askMutation.isPending}
              />
              <button
                type="submit"
                disabled={askMutation.isPending || question.trim().length < 3}
                className="absolute end-1.5 sm:end-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={content.askButton}
              >
                <HiArrowTopRightOnSquare className="w-4 h-4 sm:w-5 sm:h-5 rotate-45" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ============================================
  // HOME VIEW (initial state with suggestions)
  // ============================================
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Centered Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 pb-28 sm:pb-32">
        {/* Loading State */}
        {askMutation.isPending ? (
          <div className="flex flex-col items-center justify-center">
            <Loading size="lg" />
            <p className="text-body-1 text-neutral-600 mt-4">{content.askingButton}</p>
          </div>
        ) : (
          <>
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <ItiHubLogo className="w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="text-heading-2 sm:text-heading-1 font-bold text-primary-500 tracking-tight">
                {content.brandName}
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-body-2 sm:text-body-1 text-neutral-600 text-center max-w-sm sm:max-w-xl mb-8 sm:mb-10 px-2">
              {content.pageSubtitle}
            </p>

            {/* Suggestion Chips - Decorative Only */}
            <div className="flex flex-wrap justify-center gap-2 max-w-xs sm:max-w-2xl mb-4 sm:mb-6">
              {content.suggestionChips?.map((chip, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-neutral-200 rounded-full text-caption sm:text-body-2 text-neutral-600 shadow-sm"
                >
                  <span className="text-neutral-400">
                    {index % 4 === 0 && '🔄'}
                    {index % 4 === 1 && '📋'}
                    {index % 4 === 2 && '💰'}
                    {index % 4 === 3 && '📊'}
                  </span>
                  {chip}
                </span>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Fixed Bottom Input */}
      {!askMutation.isPending && (
        <div className="absolute bottom-0 left-0 right-0 bg-neutral-50 px-3 sm:px-4 py-4 sm:py-6">
          <form onSubmit={handleSubmit} className="max-w-sm sm:max-w-2xl mx-auto">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={content.questionPlaceholder.value}
                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 pe-12 sm:pe-14 bg-white border border-neutral-300 rounded-full text-body-2 sm:text-body-1 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-elevation-1"
                disabled={askMutation.isPending}
              />
              <button
                type="submit"
                disabled={askMutation.isPending || question.trim().length < 3}
                className="absolute end-1.5 sm:end-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={content.askButton}
              >
                <HiArrowTopRightOnSquare className="w-4 h-4 sm:w-5 sm:h-5 rotate-45" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
