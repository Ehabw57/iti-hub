import { Link } from 'react-router-dom';
import { useLocale } from 'react-intlayer';
import { useCommunitiesList } from '@hooks/queries/useCommunity';

export default function FeedRightRail() {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const query = useCommunitiesList();
  const communities = query.data?.pages?.flatMap(page => page.data?.communities ?? []).slice(0, 3) ?? [];
  return <aside className="hidden xl:flex w-72 shrink-0 flex-col gap-5">
    <section className="rounded-2xl border border-outline bg-surface p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">{ar ? 'تعلّم مع الآخرين' : 'LEARN WITH OTHERS'}</p>
      <h2 className="mt-2 text-xl font-bold">{ar ? 'مجتمعات تستحق الاكتشاف' : 'Find your circle'}</h2>
      {query.isPending && <p className="mt-4 text-sm" role="status">{ar ? 'جارٍ التحميل…' : 'Loading…'}</p>}
      {query.isError && <button className="mt-4 text-sm" onClick={() => query.refetch()}>{ar ? 'إعادة المحاولة' : 'Retry loading communities'}</button>}
      <div className="mt-4 divide-y divide-outline">{communities.map(community => <Link key={community._id} to={`/community/${community._id}`} className="block py-4"><h3 className="font-semibold">{community.name}</h3><p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-500">{community.description}</p></Link>)}</div>
      <Link to="/communities" className="mt-4 block text-sm font-semibold text-primary-600">{ar ? 'كل المجتمعات ←' : 'All communities →'}</Link>
    </section>
    <Link to="/jobs" className="rounded-2xl border border-outline bg-surface p-6"><span className="text-xs font-semibold text-primary-600">{ar ? 'خطوتك القادمة' : 'YOUR NEXT CHAPTER'}</span><h2 className="mt-2 text-xl font-bold">{ar ? 'حوّل مهاراتك إلى فرصة.' : 'Put your skills to work.'}</h2><p className="mt-3 text-sm text-neutral-500">{ar ? 'استكشف فرص العمل المتاحة.' : 'Explore career opportunities from the community.'}</p></Link>
  </aside>;
}
