import { t } from 'intlayer';

export default {
  key: 'userCommunities',
  content: {
    pageTitle: t({
      en: 'My Communities',
      ar: 'مجتمعاتي',
    }),
    errorLoadingCommunities: t({
      en: 'Failed to load your communities. Please try again.',
      ar: 'فشل تحميل مجتمعاتك. يرجى المحاولة مرة أخرى.',
    }),
    noCommunities: t({
      en: 'You haven\'t joined any communities yet',
      ar: 'لم تنضم إلى أي مجتمعات بعد',
    }),
    noCommunitiesSubtext: t({
      en: 'Explore communities and join ones that interest you!',
      ar: 'استكشف المجتمعات وانضم إلى ما يهمك!',
    }),
  },
};
