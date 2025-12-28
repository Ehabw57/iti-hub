import useCommunities from '@/hooks/queries/useCommunities';
import { Loading, ErrorDisplay } from '@/components/common';
import { useIntlayer } from 'react-intlayer';
import CommunityItem from '@/components/community/CommunityItem';

export default function CommunitiesListController() {
  const { data, isLoading, error } = useCommunities();

  const { title, empty, members, noImage , explore } =
    useIntlayer('communities-list');

  if (isLoading) return <Loading />;
  if (error) return <ErrorDisplay error={error} />;

  const communities = data?.communities ?? [];

  return (
    <div className="p-6">
      <h1 className="text-heading-2 mb-6 text-neutral-700">
        {title}
      </h1>

      {communities.length === 0 && (
        <p className="text-neutral-500">
          {empty}
        </p>
      )}

      {/* GRID */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {communities.map((community) => (
          <CommunityItem
            key={community._id}
            community={community}
            members={members}
            noImage={noImage}
            explore={explore}
          />
        ))}
      </div>
    </div>
  );
}
