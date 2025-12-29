import { useIntlayer } from 'react-intlayer';
import useUserCommunities from '@hooks/queries/useUserCommunities';
import { Loading } from '@components/common';

/**
 * Community selector dropdown
 * @param {Object} props
 * @param {string} props.value - Selected community ID
 * @param {Function} props.onChange - Change handler (communityId) => void
 */
export default function CommunitySelector({ value, onChange }) {
  const  content  = useIntlayer('postComposer');
  const { data: communities, isLoading } = useUserCommunities();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loading />
        <span className="text-sm text-neutral-600">{content.loadingCommunities}</span>
      </div>
    );
  }

  if (!communities || communities.length === 0) {
    return (
      <div className="text-sm text-neutral-500">
        {content.noCommunities}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {content.selectCommunity}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-neutral-50"
      >
        <option value="">{content.selectOption}</option>
        {communities.map(({community}) => (
          <option key={community._id} value={community._id}>
            {community.name}
          </option>
        ))}
      </select>
    </div>
  );
}
