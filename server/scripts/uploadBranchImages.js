/**
 * Upload branch images (client/public/branches) to Cloudinary and link them
 * to the matching Branch documents as coverImage.
 *
 * - Image filename (without extension) → Branch.name (case-insensitive,
 *   punctuation-flexible normalization, e.g. "smart village.jpg" →
 *   "Smart Village (HQ)", "beni suef.jpg" → "Beni Suef").
 * - Uploaded to the Cloudinary folder `branch-images` with stable public IDs
 *   (branch-images/<slug>) so re-running does NOT create duplicates.
 * - Idempotent on both sides: Cloudinary overwrite + DB backfill/refresh.
 *
 * Usage (from server/):
 *   node scripts/uploadBranchImages.js           # upload + link
 *   node scripts/uploadBranchImages.js --dry     # match check only, no uploads
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// The app's default (server/app.js) and every script here uses the same
// fallback. DB_URL may be overridden via CLI env: DB_URL=mongodb://... node ...
const MONGO_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/iti-hub';

const cloudinary = require('cloudinary').v2;
const Branch = require('../models/Branch');
const { CLOUDINARY_FOLDER_BRANCH_IMAGES } = require('../utils/constants');

const IMAGES_DIR = path.resolve(__dirname, '../../client/public/branches');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Lowercase, drop non-alphanumerics — "New Valley" ≡ "new-valley" ≡ "newvalley" */
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Aliases: local filename stem → DB branch name when they differ meaningfully.
const FILE_ALIASES = {
  'smart village': 'Smart Village (HQ)',
  'nozha': 'Nozha (Cairo)',
};

async function loadDbImages() {
  // filename stem (normalized) → { filePath, cloudinaryUrl? }
  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f));

  const entries = [];
  for (const file of files) {
    const stem = file.replace(/\.[^.]+$/, '');
    // public_id WITHOUT the folder prefix — Cloudinary prepends `folder`
    // automatically, so final public_id = `branch-images/<slug>`.
    const publicId = slugify(stem);
    entries.push({
      file,
      stem,
      publicId,
      url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${CLOUDINARY_FOLDER_BRANCH_IMAGES}/${publicId}`,
    });
  }
  return entries;
}

const MAPPING_PATH = path.resolve(__dirname, 'data/branchImageMap.json');

/** Persist filename → Cloudinary URL mapping (used by the seeder for fresh DBs). */
function saveMapping(pairs) {
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(pairs, null, 2));
  console.log(`💾 Mapping saved: ${path.relative(process.cwd(), MAPPING_PATH)}`);
}

async function main() {
  const dry = process.argv.includes('--dry');
  const images = await loadDbImages();
  console.log(
    `🖼️  Found ${images.length} image(s) in ${path.relative(process.cwd(), IMAGES_DIR)}\n`
  );

  await mongoose.connect(MONGO_URL);
  console.log(`✅ MongoDB connected (${mongoose.connection.name})\n`);

  const branches = await Branch.find({}).lean();
  console.log(`🏢 Branches in DB: ${branches.length}\n`);

  const byNormalized = new Map(branches.map((b) => [normalize(b.name), b]));
  const branchUpdates = []; // { branch, url, file }

  // --- Match images to branches -------------------------------------------
  const unmatchedFiles = [];
  for (const img of images) {
    const target =
      byNormalized.get(normalize(img.stem)) ||
      byNormalized.get(normalize(FILE_ALIASES[img.stem] || ''));
    if (target) {
      branchUpdates.push({ ...img, branch: target });
    } else {
      unmatchedFiles.push(img);
    }
  }

  if (unmatchedFiles.length) {
    const dbNames = branches.map((b) => b.name).join(', ');
    console.warn('⚠️  No DB branch matched for:');
    for (const u of unmatchedFiles) console.warn(`   - ${u.file}`);
    console.warn(`   DB branches: ${dbNames}\n`);
  }

  // --- Report (and stop here for --dry) -----------------------------------
  console.log('🔗 Matched images → branches:');
  for (const u of branchUpdates) {
    console.log(`   ${u.file.padEnd(22)} → ${u.branch.name}`);
  }
  console.log('');

  // Mapping is filename→URL (DB-independent), saved even in dry mode.
  // Includes ALL images so branches created later can pick theirs up too.
  saveMapping(
    images.map((img) => ({
      file: img.file,
      url: img.url,
      branchName: branchUpdates.find((u) => u.file === img.file)?.branch.name || null,
    }))
  );

  if (dry) {
    console.log('🧪 Dry run — no uploads, no DB writes.');
    await mongoose.disconnect();
    return;
  }

  // --- Upload ALL images (DB update only for matched branches) -------------
  const mapping = [];
  let uploaded = 0;
  for (const img of images) {
    const result = await cloudinary.uploader.upload(path.join(IMAGES_DIR, img.file), {
      public_id: img.publicId,
      folder: CLOUDINARY_FOLDER_BRANCH_IMAGES,
      overwrite: true,
      resource_type: 'image',
    });
    uploaded += 1;
    console.log(`   ☁️  [${uploaded}/${images.length}] ${img.file} → ${result.secure_url}`);

    const matched = branchUpdates.find((u) => u.file === img.file);
    if (matched) {
      await Branch.updateOne(
        { _id: matched.branch._id },
        { $set: { coverImage: result.secure_url } }
      );
    }
    mapping.push({
      file: img.file,
      branchName: matched ? matched.branch.name : null,
      url: result.secure_url,
    });
  }

  saveMapping(mapping);

  const skippedNoImage = branches.filter(
    (b) => !branchUpdates.some((u) => String(u.branch._id) === String(b._id))
  );
  if (skippedNoImage.length) {
    console.log(
      `\nℹ️  Branches without an image (coverImage left unchanged): ${skippedNoImage
        .map((b) => b.name)
        .join(', ')}`
    );
  }

  console.log(
    `\n🎉 Done — ${uploaded} image(s) uploaded to Cloudinary, ${branchUpdates.length} branch(es) updated.`
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Upload failed:', err.message || err);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exitCode = 1;
});
