/**
 * One-off migration: replace square (500x500) community cover images —
 * originally seeded from SEED_COMMUNITY_IMAGES — with wide (1500x500)
 * banners from SEED_COVER_IMAGES.
 *
 * Why: the client's community cards and headers render covers in wide
 * bands (~3:1), so square covers were heavily cropped. Fresh seeds now use
 * SEED_COVER_IMAGES (see scripts/seedCommunities.js); this script heals
 * databases seeded before that change, without re-running the destructive
 * full seed (which would wipe posts/communities).
 *
 * Idempotent: only communities whose coverImage is one of the square
 * SEED_COMMUNITY_IMAGES URLs are touched.
 *
 * Usage:
 *   node scripts/updateCommunityCovers.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Community = require('../models/Community');
const { SEED_COMMUNITY_IMAGES, SEED_COVER_IMAGES } = require('../utils/constants');

async function run() {
  try {
    await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/iti-hub');
    console.log('✅ MongoDB connected');

    const squareSet = new Set(SEED_COMMUNITY_IMAGES);
    const communities = await Community.find({}).sort({ name: 1 });
    let updated = 0;

    for (let i = 0; i < communities.length; i++) {
      const community = communities[i];
      if (!squareSet.has(community.coverImage)) continue;

      community.coverImage = SEED_COVER_IMAGES[i % SEED_COVER_IMAGES.length];
      await community.save();
      updated++;
      console.log(`   🖼️  ${community.name}: cover → wide 1500x500 banner`);
    }

    console.log(
      `\n✅ Community covers updated: ${updated}/${communities.length}` +
      ` (skipped ${communities.length - updated} already wide)`
    );
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

run();
