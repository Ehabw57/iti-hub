const Post = require("../models/Post");
const User = require("../models/User");
const {
  MAX_POST_IMAGES,
  MAX_POST_CONTENT_LENGTH,
} = require("../utils/constants");

const sampleContents = [
  "First post on the platform 🚀",
  "Learning Node.js and MongoDB",
  "This platform looks promising!",
  "Backend seeding is actually fun 😄",
  "Testing posts feature",
  "Hello world from ITI Hub",
  "MongoDB relations working perfectly",
  "Express + Mongoose combo 💪",
];

const seedPosts = async (users) => {
  console.log("📝 Seeding posts...");

  await Post.deleteMany();

  const posts = []; // non-repost posts to insert first
  const repostQueue = []; // reposts to create after we have inserted originals

  // weighted probabilities (sum = 1)
  // 0: normal, 1: single image, 2: multi image, 3: long content, 4: repost
  const typeWeights = [0.55, 0.2, 0.15, 0.08, 0.02];

  function pickType() {
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < typeWeights.length; i++) {
      acc += typeWeights[i];
      if (r <= acc) return i;
    }
    return 0;
  }

  function makeImage(authorId, idx, extra = "") {
    return `https://picsum.photos/seed/${authorId}-${idx}${extra}/600/400`;
  }

  // helper to generate a long but valid content (not exceeding MAX_POST_CONTENT_LENGTH)
  function generateLongContent() {
    const target = Math.min(MAX_POST_CONTENT_LENGTH, 3000);
    let out = "";
    while (out.length < target) {
      out += sampleContents[Math.floor(Math.random() * sampleContents.length)] + " ";
    }
    return out.trim().slice(0, target);
  }

  for (const user of users) {
    const postsPerUser = Math.floor(Math.random() * 3) + 1; // 1–3 posts

    for (let i = 0; i < postsPerUser; i++) {
      const type = pickType();

      // If repost chosen but there are no existing posts yet, fallback to normal
      if (type === 4 && posts.length === 0) {
        // fallback
      }

      if (type === 4 && posts.length > 0) {
        // queue a repost to be created after we have real _ids
        repostQueue.push({
          author: user._id,
          // optional comment on repost
          repostComment:
            Math.random() > 0.6
              ? sampleContents[Math.floor(Math.random() * sampleContents.length)]
              : undefined,
        });
        continue;
      }

      // build a normal/non-repost post document
      const doc = {
        author: user._id,
        content:
          sampleContents[Math.floor(Math.random() * sampleContents.length)],
        images: [],
        tags: [],
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        savesCount: 0,
      };

      if (type === 1) {
        // single image
        doc.images = [makeImage(user._id, i)];
      } else if (type === 2) {
        // multiple images (2-5 or up to MAX_POST_IMAGES)
        const maxMulti = Math.min(5, MAX_POST_IMAGES);
        const count = Math.floor(Math.random() * (maxMulti - 1)) + 2; // 2..maxMulti
        doc.images = Array.from({ length: count }).map((_, idx) =>
          makeImage(user._id, `${i}-${idx}`)
        );
      } else if (type === 3) {
        // long content
        doc.content = generateLongContent();
      }

      posts.push(doc);
    }
  }

  // insert non-repost posts first
  const createdPosts = await Post.insertMany(posts);

  // Now create repost documents referencing random originals
  const repostDocs = [];
  for (const r of repostQueue) {
    const original =
      createdPosts[Math.floor(Math.random() * createdPosts.length)];
    repostDocs.push({
      author: r.author,
      originalPost: original._id,
      repostComment: r.repostComment,
      // reposts can be empty for content/images
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      savesCount: 0,
    });
  }

  const createdReposts = repostDocs.length
    ? await Post.insertMany(repostDocs)
    : [];

  // Update repost counts for original posts
  if (createdReposts.length) {
    const originalIncrement = createdReposts.reduce((acc, rp) => {
      const key = rp.originalPost.toString();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const postBulk = Object.keys(originalIncrement).map((id) => ({
      updateOne: {
        filter: { _id: id },
        update: { $inc: { repostsCount: originalIncrement[id] } },
      },
    }));

    if (postBulk.length) {
      await Post.bulkWrite(postBulk);
    }
  }

  const allCreated = createdPosts.concat(createdReposts);

  // تحديث postsCount لكل يوزر
  const bulkUpdates = users.map((user) => {
    const count = allCreated.filter(
      (p) => p.author.toString() === user._id.toString()
    ).length;

    return {
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { postsCount: count } },
      },
    };
  });

  await User.bulkWrite(bulkUpdates);

  console.log(`✅ Posts seeded: ${allCreated.length}`);
  return allCreated;
};

module.exports = seedPosts;
