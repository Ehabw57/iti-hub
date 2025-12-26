export default function PostItem({ post }) {
  return (
    <div className="p-3 border-b">
      <div className="text-sm text-neutral-700">{post.content}</div>
      <div className="text-xs text-neutral-400 mt-1">{post.author?.username}</div>
    </div>
  );
}
