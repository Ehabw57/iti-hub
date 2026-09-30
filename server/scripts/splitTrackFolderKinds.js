/**
 * One-off migration — split the shared per-track folder list into two
 * independent per-tab lists by adding the `kind` discriminator
 * ('files' for the Files tab, 'records' for the Records tab).
 *
 * Rules applied to every existing folder:
 *   - referenced only by CourseFile docs   -> kind 'files'
 *   - referenced only by TrackRecord docs  -> kind 'records'
 *   - referenced by BOTH (legacy shared)   -> kept as 'files' for its file
 *     refs; a 'records' twin is created and adopts the record refs
 *   - referenced by neither                -> kind 'files'
 *
 * The legacy unique index { trackId, name } (one name per track across both
 * tabs) is dropped and replaced with { trackId, kind, name } so the same
 * name can now exist once per tab.
 *
 * Idempotent: safe to re-run (twins are not duplicated twice).
 *
 * Usage: node scripts/splitTrackFolderKinds.js
 * DB selection: DB_URL env var (default mongodb://127.0.0.1:27017/iti-hub)
 */
const mongoose = require('mongoose');

async function run() {
  const url = process.env.DB_URL || 'mongodb://127.0.0.1:27017/iti-hub';
  await mongoose.connect(url);
  console.log(`✅ MongoDB connected (${url})\n`);
  const foldersCol = mongoose.connection.db.collection('trackfolders');
  const filesCol = mongoose.connection.db.collection('coursefiles');
  const recordsCol = mongoose.connection.db.collection('trackrecords');

  // 1) Drop the legacy unique index FIRST — otherwise same-name twins for
  //    the other tab would violate it. Match by key pattern, not by name.
  const indexes = await foldersCol.indexes();
  const legacyIndex = indexes.find(
    (ix) =>
      ix.key &&
      Object.keys(ix.key).length === 2 &&
      'trackId' in ix.key &&
      'name' in ix.key &&
      !('kind' in ix.key)
  );
  if (legacyIndex) {
    await foldersCol.dropIndex(legacyIndex.name);
    console.log(`🧹 Dropped legacy unique index '${legacyIndex.name}'`);
  } else {
    console.log('ℹ️  No legacy { trackId, name } index present — skipping drop');
  }

  const folders = await foldersCol.find({}).toArray();
  console.log(`📁 Folders found: ${folders.length}\n`);

  const fileRefIds = new Set(
    (await filesCol.distinct('folderId', { folderId: { $ne: null } })).map(String)
  );
  const recordRefIds = new Set(
    (await recordsCol.distinct('folderId', { folderId: { $ne: null } })).map(String)
  );

  const kindTally = { files: 0, records: 0 };
  let twinsCreated = 0;
  let recordsMoved = 0;

  for (const folder of folders) {
    const id = String(folder._id);
    const hasFiles = fileRefIds.has(id);
    const hasRecords = recordRefIds.has(id);

    if (hasFiles && hasRecords) {
      // Shared legacy folder: keep the doc as the 'files' one and create a
      // 'records' twin that adopts the record refs (idempotent).
      let twin = await foldersCol.findOne({
        trackId: folder.trackId,
        name: folder.name,
        kind: 'records',
      });
      if (!twin) {
        const res = await foldersCol.insertOne({
          trackId: folder.trackId,
          kind: 'records',
          name: folder.name,
          createdBy: folder.createdBy,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
          __v: folder.__v ?? 0,
        });
        twin = { _id: res.insertedId };
        twinsCreated += 1;
      }
      const moved = await recordsCol.updateMany(
        { folderId: folder._id },
        { $set: { folderId: twin._id } }
      );
      recordsMoved += moved.modifiedCount;
      console.log(
        `  ➕ '${folder.name}' was shared by both tabs -> records twin created, ${moved.modifiedCount} record(s) moved onto it`
      );
      await foldersCol.updateOne({ _id: folder._id }, { $set: { kind: 'files' } });
      kindTally.files += 1;
      continue;
    }

    const kind = hasRecords ? 'records' : 'files';
    await foldersCol.updateOne({ _id: folder._id }, { $set: { kind } });
    kindTally[kind] += 1;
    console.log(`  ${kind === 'records' ? '🎥' : '📄'} '${folder.name}' -> kind '${kind}'`);
  }

  // 2) New per-tab unique index (matches the updated TrackFolder model).
  await foldersCol.createIndex({ trackId: 1, kind: 1, name: 1 }, { unique: true });
  console.log('\n🔒 Created unique index { trackId: 1, kind: 1, name: 1 }');

  console.log(
    `\nDone: ${kindTally.files} files-kind, ${kindTally.records} records-kind, ` +
      `${twinsCreated} twin(s) created, ${recordsMoved} record(s) reassigned`
  );
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
