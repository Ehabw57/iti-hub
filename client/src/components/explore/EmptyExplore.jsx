import { useIntlayer } from 'react-intlayer';
import { HiUserGroup } from 'react-icons/hi2';

/**
 * Empty state component for communities explore page
 */
export default function EmptyExplore({ hasFilters = false }) {
  const content = useIntlayer('exploreCommunities');

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-primary-100 rounded-full p-6 mb-4">
        <HiUserGroup className="w-12 h-12 text-primary-600" />
      </div>
      
      <h3 className="text-heading-4 text-neutral-800 mb-2 text-center">
        {hasFilters ? content.noSearchResultsTitle : content.noCommunitiesTitle}
      </h3>
      
      <p className="text-body-2 text-neutral-600 text-center max-w-md">
        {hasFilters ? content.noSearchResultsMessage : content.noCommunitiesMessage}
      </p>
    </div>
  );
}
