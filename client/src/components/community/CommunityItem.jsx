import { Card } from '@/components/common';
import { Link } from 'react-router-dom';

export default function CommunityItem({ community, members, noImage , explore}) {
  return (
     <Link
      to={`/communities/${community._id}`}
      className="group block h-full"
    >
    <Card
      className="
        h-full
        flex flex-col
        rounded-2xl
        overflow-hidden
        transition-transform
        hover:-translate-y-1
        hover:shadow-xl
        text-neutral-900
      "
    >
      {/* COVER IMAGE */}
      <div className="relative h-40 bg-neutral-100">
        {community.coverImage ? (
          <img
            src={community.coverImage}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-neutral-600 dark:text-neutral-400">
            {noImage}
          </div>
        )}

        {/* AVATAR */}
        <div
          className="
            absolute -bottom-6 left-4 h-12 w-12
            rounded-full overflow-hidden
            ring-2 ring-neutral-50
            bg-neutral-300
            flex items-center justify-center
          "
        >
          {community.profilePicture ? (
            <img
              src={community.profilePicture}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
              {community.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-4 pt-8 pb-4 flex flex-col flex-1">
        <h2 className="font-semibold truncate text-neutral-900">
          {community.name}
        </h2>

        {/* TAGS */}
        {community.tags?.length > 0 && (
          <p className="mt-1 text-xs text-neutral-500">
            {community.tags.map(tag => `#${tag}`).join(' ')}
          </p>
        )}

        <p className="mt-2 text-sm text-neutral-600 line-clamp-2 min-h-[40px]">
          {community.description}
        </p>

        {/* FOOTER */}
        <div className="mt-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-500">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium">
              {community.memberCount ?? 0}
            </span>
            <span>{members}</span>
          </div>

          <span
            className="
              rounded-full px-4 py-1.5 transition
              bg-neutral-200 text-neutral-900 hover:bg-neutral-300
            "
          >
            {explore}
          </span>
        </div>
      </div>
    </Card>
    </Link>
  );
}
