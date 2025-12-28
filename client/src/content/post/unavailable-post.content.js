import { t } from "intlayer";

const unavailablePostContent = {
  key: "unavailable-post",
  content: {
    title: t({
      en: "Post Unavailable",
      ar: "المنشور غير متاح",
    }),
    description: t({
      en: "This post has been removed or is no longer available.",
      ar: "تم حذف هذا المنشور أو أصبح غير متاح.",
    }),
    compactMessage: t({
      en: "This post is no longer available",
      ar: "هذا المنشور لم يعد متاحًا",
    }),
  },
};

export default unavailablePostContent;
