export default function CommunityItem({ community }) {
  return (
    <div className="p-3 border-b">
      <div className="font-semibold">{community.name}</div>
      <div className="text-sm text-neutral-500">{community.description}</div>
    </div>
  );
}
