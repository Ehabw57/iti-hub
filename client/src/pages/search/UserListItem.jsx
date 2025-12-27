
export default function UserListItem({ user }) {
  return (
    <div className="p-3 border-b flex items-center gap-3">
      <img
        src={user.profilePicture || '/avatar.png'}
        className="w-10 h-10 rounded-full object-cover"
        alt="avatar"
      />
      <div>
        <div className="font-semibold">{user.username}</div>
        <div className="text-sm text-neutral-500">{user.fullName}</div>
      </div>
      <div className="ml-auto text-sm text-neutral-500">
        {user.isFollowing ? 'Following' : ''}
      </div>
    </div>
  );
}
