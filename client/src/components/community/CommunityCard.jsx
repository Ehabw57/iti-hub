// size: 'large' | 'medium' | 'small'
// community: object with fields from Community.js

const CommunityCard = ({ community, size = 'small' }) => {
    if (!community) return null;

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
            <div className="community-card--large rounded-xl shadow-elevation-2 bg-neutral-50 p-6 max-w-xl">
                {coverImage && (
                    <img
                        className="w-full h-40 object-cover rounded-lg mb-4"
                        src={coverImage}
                        alt="Cover"
                    />
                )}
                <div className="flex items-center gap-4 mb-4">
                    <img
                        className="w-20 h-20 rounded-full border-4 border-primary-200 object-cover"
                        src={profilePicture || '/default-community.png'}
                        alt={name}
                    />
                    <div>
                        <p className="text-xs text-neutral-700">{name}</p>
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
                <p className="text-body-2 text-neutral-700 mb-4">{description}</p>
                <div className="flex flex-wrap gap-4 text-caption text-neutral-600">
                    <span>{memberCount} members</span>
                    <span>{postCount} posts</span>
                    <span>{owners?.length} owners</span>
                    <span>{moderators?.length} moderators</span>
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
                    <h3 className="text-heading-4 text-primary-700">{name}</h3>
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
            <div>
                <p className="text-xs text-neutral-700 truncate">{name}</p>
            </div>
        </div>
    );
};

export default CommunityCard;
