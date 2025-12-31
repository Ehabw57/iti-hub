// size: 'large' | 'medium' | 'small'
// community: object with fields from Community.js OR extended object with { community, role, joinedAt }

import { Link } from "react-router-dom";

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
        owners,
        moderators,
    } = community;
    console.log('[CommunityCard] community:', community);

    if (size === 'large') {
        return (
            <div className="community-card--large rounded-xl shadow-elevation-2 bg-neutral-50 p-0 flex flex-col overflow-hidden">
                <img
                    className="w-full h-32 object-cover rounded-t-xl"
                    src={coverImage || '/default-cover.png'}
                    alt="Cover"
                />
                <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                        <img
                            className="w-16 h-16 rounded-full border-4 border-primary-200 object-cover"
                            src={profilePicture || '/default-community.png'}
                            alt={name}
                        />
                        <div>
                            <p className="text-heading-5 text-primary-700 font-bold">{name}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {tags && tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="bg-primary-100 text-primary-700 text-caption px-2 py-0.5 rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <p className="text-body-2 text-neutral-700 mb-4 line-clamp-3">{description}</p>
                    <div className="flex flex-wrap gap-4 text-caption text-neutral-600 mb-4">
                        <span>{memberCount} members</span>
                        <span>{postCount} posts</span>
                        <span>{owners?.length} owners</span>
                        <span>{moderators?.length} moderators</span>
                    </div>
                    <div className="mt-auto">
                        <Link
                            to={`/community/${community._id}`}
                            className="inline-block w-full h-10 text-center px-4 py-2 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
                            >Explore
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (size === 'medium') {
        return (
            <div className="community-card--medium rounded-lg shadow-elevation-1 bg-neutral-50 p-4 flex gap-4 max-w-md">
                <img
                    className="w-16 h-16 rounded-full border-2 border-primary-200 object-cover"
                    src={profilePicture || '/default-community.png'}
                    alt={name}
                />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-heading-4 text-primary-700">{name}</h3>
                        {userRole && (
                            <span className="bg-primary-600 text-white text-caption px-2 py-0.5 rounded-full">
                                {userRole}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {tags && tags.slice(0, 3).map(tag => (
                            <span
                                key={tag}
                                className="bg-primary-100 text-primary-700 text-caption px-2 py-0.5 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                    <p className="text-body-2 text-neutral-700 mt-1">
                        {description?.slice(0, 100)}
                        {description && description.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex gap-4 text-caption text-neutral-600 mt-2">
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
                        <span className="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {userRole}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommunityCard;
