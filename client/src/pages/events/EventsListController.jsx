import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  HiOutlineCalendarDays,
  HiOutlineMapPin,
  HiOutlineUsers,
} from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { useAuthStore } from '@store/auth';
import { useEvents } from '@hooks/queries/useCourse';
import { useToggleEventRegister } from '@hooks/mutations/useCourseMutations';
import { ErrorDisplay } from '@components/common';
import useRequireAuth from '@hooks/useRequireAuth';
import eventsContent from '@/content/events/events.content';
import EventCard from './EventCard';

/**
 * EventsListController — events page (work order §1).
 * Upcoming/past split, Register/Unregister toggle reflecting the current
 * user's registration state, expand-in-place details. Auth required (GET
 * /events is auth-gated) — guests get a sign-in prompt card instead.
 */
export default function EventsListController() {
  const content = useIntlayer(eventsContent.key);
  const navigate = useNavigate();
  const { requireAuth } = useRequireAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError, refetch } = useEvents();
  const registerMutation = useToggleEventRegister();
  const [expandedId, setExpandedId] = useState(null);

  // Envelope: axios response → body {success, data:{events}} (sendSuccess)
  const events = data?.data?.data?.events ?? [];

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now);

  const handleToggleRegister = (eventId) => {
    requireAuth(async () => {
      try {
        await registerMutation.mutateAsync(eventId);
        toast.success(content.registerSuccess.value);
      } catch (err) {
        toast.error(err?.response?.data?.error?.message || content.registerError.value);
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
          <HiOutlineCalendarDays className="w-6 h-6 text-primary-600" strokeWidth={1.7} />
        </div>
        <h2 className="text-heading-4 text-neutral-900 mb-2 text-center">
          {content.signInToView.value}
        </h2>
        <p className="text-body-2 text-neutral-500 mb-6 text-center">
          {content.signInRequiredMessage.value}
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="h-10 px-5 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
          >
            {content.signIn.value}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      {/* Page header */}
      <header className="border-b border-neutral-200 px-4 sm:px-0 py-4">
        <h1 className="text-heading-2 text-neutral-900">
          {content.pageTitle.value}
        </h1>
        <p className="text-body-2 text-neutral-500 mt-1">
          {content.pageSubtitle.value}
        </p>
      </header>

      {isLoading && (
        <div className="divide-y divide-neutral-200 border-b border-neutral-200">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 sm:px-0 py-4 animate-pulse">
              <div className="h-4 w-2/5 rounded bg-neutral-100" />
              <div className="mt-2 h-3 w-3/5 rounded bg-neutral-100" />
              <div className="mt-3 h-6 w-24 rounded-full bg-neutral-100" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="py-10 px-4">
          <ErrorDisplay message={content.errorLoading.value} onRetry={refetch} />
        </div>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="py-16 text-center px-4">
          <h2 className="text-heading-4 text-neutral-900 mb-2">
            {content.emptyTitle.value}
          </h2>
          <p className="text-body-2 text-neutral-500">
            {content.emptyMessage.value}
          </p>
        </div>
      )}

      {!isLoading && !isError && upcoming.length > 0 && (
        <section>
          <h2 className="text-heading-5 text-neutral-500 px-4 sm:px-0 py-4">
            {content.upcoming.value}
          </h2>
          <ol className="divide-y divide-neutral-200 border-b border-neutral-200">
            {upcoming.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                content={content}
                expanded={expandedId === event._id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === event._id ? null : event._id)
                }
                onToggleRegister={() => handleToggleRegister(event._id)}
                registerPending={registerMutation.isPending}
              />
            ))}
          </ol>
        </section>
      )}

      {!isLoading && !isError && past.length > 0 && (
        <section className="mt-2">
          <h2 className="text-heading-5 text-neutral-500 px-4 sm:px-0 py-4">
            {content.past.value}
          </h2>
          <ol className="divide-y divide-neutral-200 border-b border-neutral-200">
            {past.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                content={content}
                expanded={expandedId === event._id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === event._id ? null : event._id)
                }
                onToggleRegister={() => handleToggleRegister(event._id)}
                registerPending={registerMutation.isPending}
                isPast
              />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
