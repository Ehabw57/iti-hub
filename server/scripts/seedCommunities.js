// server/scripts/seedCommunities.js  (أو المسار اللي عندك)
const Community = require("../models/Community");
const {
  COMMUNITY_TAGS,
  MIN_COMMUNITY_TAGS,
  MAX_COMMUNITY_TAGS,
} = require("../utils/constants"); // مسار بالنسبة لمجلد server/scripts

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1518770660439-4636190af475",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
  "https://images.unsplash.com/photo-1551434678-e076c223a692",
];

const PROFILE_IMAGES = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12",
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
];


const sampleCommunities = [
  {
    name: "Frontend Developers",
    description: "All about HTML, CSS, JavaScript & React",
    // سنملأ tags من COMMUNITY_TAGS أدناه
  },
  {
    name: "Backend Developers",
    description: "Node.js, Databases, APIs and Architecture",
  },
  {
    name: "UI / UX Designers",
    description: "Design systems, UX research & Figma",
  },
  {
    name: "DevOps",
    description: "CI/CD, Docker, Kubernetes & Cloud",
  },
  {
    name: "Mobile Development",
    description: "Flutter, React Native & Mobile apps",
  },
];

function pickTagForSample(idx) {
  // بسيط: نحاول نطابق sample على قائمة الـ constants،
  // وإلا نأخذ أول قيمة من COMMUNITY_TAGS كفاصل أمان
  const fallback = COMMUNITY_TAGS[0] ? COMMUNITY_TAGS[0] : "general";
  // توزيع بسيط عبر قائمة الـ constants
  if (!COMMUNITY_TAGS || COMMUNITY_TAGS.length === 0) return [fallback];
  const tag = COMMUNITY_TAGS[idx % COMMUNITY_TAGS.length];
  return [tag];
}

const seedCommunities = async (users) => {
  console.log("👥 Seeding communities...");
  await Community.deleteMany();

  // Print constants to be sure
  console.log("COMMUNITY_TAGS:", COMMUNITY_TAGS);
  console.log("MIN_COMMUNITY_TAGS:", MIN_COMMUNITY_TAGS);
  console.log("MAX_COMMUNITY_TAGS:", MAX_COMMUNITY_TAGS);

  const communities = [];

  for (let i = 0; i < sampleCommunities.length; i++) {
    const data = sampleCommunities[i];
    const owner = users[Math.floor(Math.random() * users.length)];

    // اختر tags من القائمة الرسمية
    const tags = pickTagForSample(i);

    // debug check قبل ال-create
    const tagsOk =
      Array.isArray(tags) &&
      tags.length >= MIN_COMMUNITY_TAGS &&
      tags.length <= MAX_COMMUNITY_TAGS &&
      tags.every((t) => COMMUNITY_TAGS.includes(t));

    console.log(`Creating community "${data.name}" with tags:`, tags, "=> tagsOk:", tagsOk);

    if (!tagsOk) {
      console.error(
        `Skipping "${data.name}" because tags not valid or not in COMMUNITY_TAGS.`
      );
      continue;
    }

    try {
      const community = await Community.create({
  name: data.name,
  description: data.description,
  owners: [owner._id],
  moderators: [],
  memberCount: Math.floor(Math.random() * 500) + 10,
  postCount: Math.floor(Math.random() * 200),
  tags,

  coverImage: COVER_IMAGES[i % COVER_IMAGES.length],
  profilePicture: PROFILE_IMAGES[i % PROFILE_IMAGES.length],
});


      communities.push(community);
    } catch (err) {
      console.error("Failed to create community:", data.name);
      console.error(err && err.errors ? err.errors : err);
      // استمر في الباقي بدل ما يقفل العملية كلها
    }
  }

  console.log(`✅ Communities seeded: ${communities.length}`);
  return communities;
};

module.exports = seedCommunities;
