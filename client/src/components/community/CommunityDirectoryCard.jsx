import { Link } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { Chip } from '@components/common';
import groupsContent from '@/content/groups/groups.content';

/**
 * Group card — visual variant for the Communities page (matches /screens groups mockup).
 * Cover band with icon badge + body with name, description and member footer.
 */
export default function CommunityDirectoryCard({ community }) {
  const content = useIntlayer(groupsContent.key);
  if (!community) return null;

  const { name, description, profilePicture, coverImage, tags, memberCount } =
    community;

  return (
    <Link
      to={`/community/${community._id}`}
      className="group block bg-neutral-100 border border-outline rounded-2xl overflow-hidden hover:shadow-elevation-2 hover:-translate-y-0.5 transition-all"
    >
      {/* Cover band — fixed aspect-ratio container (work order §3): the
          image fills the box with object-cover regardless of source aspect */}
      <div className="relative aspect-[3/1] bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800">
        {coverImage && (
          <img
            src={coverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
        )}
        {/* Decorative ring */}
        <span className="absolute -bottom-8 ltr:-right-6 rtl:-left-6 w-24 h-24 rounded-full border-[10px] border-white/10" />
      </div>

      {/* Avatar overlapping the cover */}
      <div className="px-5 pb-5">
        <div className="-mt-8 mb-3 relative">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={name}
              className="w-16 h-16 rounded-2xl object-cover border-4 border-neutral-100 shadow-elevation-1"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-surface-high flex items-center justify-center border-4 border-neutral-100 shadow-elevation-1">
              <HiOutlineUserGroup className="w-8 h-8 text-secondary-700" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="text-heading-6 text-neutral-900 truncate mb-1 group-hover:text-primary-600 transition-colors">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-body-2 text-neutral-500 line-clamp-2 mb-3 min-h-[2.5rem]">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <Chip key={tag} size="xs" hash>
                {tag}
              </Chip>
            ))}
          </div>
        )}

        {/* Member count footer */}
        <div className="flex items-center gap-1.5 text-caption text-neutral-500 pt-3 border-t border-outline">
          <HiOutlineUserGroup className="w-4 h-4" />
          <span>
            {memberCount ?? 0} {content.members.value}
          </span>
        </div>
      </div>
    </Link>
  );
}
