// size: 'large' | 'medium' | 'small'
// community: object with fields from Community.js OR extended object with { community, role, joinedAt }

import { Link } from "react-router-dom";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { Chip } from '@components/common';

const CommunityCard = ({ community: communityProp, size = 'small' }) => {
    if (!communityProp) return null;

    // Handle both direct community object and extended object with role/joinedAt
    const isExtended = communityProp.community !== undefined;
    const community = isExtended ? communityProp.community : communityProp;
    const userRole = isExtended ? communityProp.role : null;
    const joinedAt = isExtended ? communityProp.joinedAt : null;

    const {
        name,
        description,
        profilePicture,
        coverImage,
        tags,
        memberCount,
        postCount,
    } = community;
    // console.log('[CommunityCard] community:', community);

    if (size === 'large') {
        return (
            <div className="community-card--large rounded-xl shadow-elevation-2 bg-neutral-100 border border-outline overflow-hidden flex flex-col hover:shadow-elevation-3 hover:-translate-y-0.5 transition-all">
                {/* Cover — fixed aspect-ratio container (work order §3): the
                    image fills the box with object-cover regardless of source
                    aspect; the gradient stays as a graceful no-image fallback */}
                <div className="relative aspect-[16/6] bg-gradient-to-br from-primary-600 via-secondary-800 to-secondary-900">
                    {coverImage ? (
                        <img
                            className="absolute inset-0 w-full h-full object-cover"
                            src={coverImage}
                            alt={`${name || 'Community'} cover`}
                        />
                    ) : null}
                    <span className="absolute -top-6 ltr:-right-6 rtl:-left-6 w-24 h-24 rounded-full border-[10px] border-white/10" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                        {profilePicture ? (
                            <img
                                className="w-16 h-16 rounded-2xl border-4 border-neutral-100 object-cover shadow-elevation-1"
                                src={profilePicture}
                                alt={name}
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-surface-high border-4 border-neutral-100 shadow-elevation-1 flex items-center justify-center">
                                <HiOutlineUserGroup className="w-8 h-8 text-secondary-700" strokeWidth={1.5} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-heading-5 text-neutral-900 font-bold truncate">{name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {tags && tags.slice(0, 3).map(tag => (
                                    <Chip key={tag} size="xs" hash>
                                        {tag}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    </div>
                    {description && (
                        <p className="text-body-2 text-neutral-500 line-clamp-2 mb-3 min-h-[2.5rem]">{description}</p>
                    )}
                    <div className="mt-auto pt-3 border-t border-outline">
                        <Link
                            to={`/community/${community._id}`}
                            className="inline-flex w-full h-10 items-center justify-center px-4 rounded-full bg-primary-600 text-white text-button font-semibold hover:bg-primary-700 transition-colors"
                            >Explore
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (size === 'medium') {
        return (
            <div className="community-card--medium rounded-xl shadow-elevation-2 bg-neutral-100 border border-outline p-4 flex gap-4 max-w-md hover:shadow-elevation-3 transition-all">
                {profilePicture ? (
                    <img
                        className="w-16 h-16 rounded-2xl border border-outline object-cover shrink-0"
                        src={profilePicture}
                        alt={name}
                    />
                ) : (
                    <div className="w-16 h-16 rounded-2xl bg-surface-high border border-outline flex items-center justify-center shrink-0">
                        <HiOutlineUserGroup className="w-8 h-8 text-secondary-700" strokeWidth={1.5} />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-heading-6 text-neutral-900 truncate">{name}</h3>
                        {userRole && (
                            <Chip
                                size="xs"
                                tone="border-transparent bg-primary-600 text-white"
                                className="shrink-0"
                            >
                                {userRole}
                            </Chip>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {tags && tags.slice(0, 3).map(tag => (
                            <Chip key={tag} size="xs" hash>
                                {tag}
                            </Chip>
                        ))}
                    </div>
                    <p className="text-body-2 text-neutral-500 mt-1 line-clamp-2">
                        {description?.slice(0, 100)}
                        {description && description.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex gap-4 text-caption text-neutral-500 mt-2">
                        <span>{memberCount} members</span>
                        <span>{postCount} posts</span>
                        {joinedAt && (
                            <span>Joined {new Date(joinedAt).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Small size
    return (
        <div className="rounded-md shadow-elevation-1 bg-neutral-50 p-3 flex gap-3 items-center max-w-xs">
            <img
                className="w-7 h-7 rounded-full border border-primary-200 object-cover"
                src={profilePicture || '/default-community.png'}
                alt={name}
            />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-xs text-neutral-700 truncate">{name}</p>
                    {userRole && (
                        <Chip
                            size="xs"
                            tone="border-transparent bg-primary-600 text-white"
                        >
                            {userRole}
                        </Chip>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommunityCard;
