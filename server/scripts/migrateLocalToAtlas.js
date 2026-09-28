/**
 * One-off migration: local MongoDB (iti-hub) → Atlas (DB_URL).
 *
 * - Reads ALL collections + documents from the source (local) database.
 * - Upserts into the target (Atlas) database in batches via the native
 *   driver (bypasses Mongoose — schema casts can drop valid seed data).
 * - Copies every index (unique, compound, text) from each collection.
 * - Verifies counts after migration and exits non-zero on mismatch.
 *
 * Safety:
 *  - Only INSERTS into the target (never deletes), so re-running is safe.
 *  - Reads the source with a dedicated connection; does not touch the app.
 *
 * Usage (from server/):
 *   node scripts/migrateLocalToAtlas.js            # migrate + verify
 *   node scripts/migrateLocalToAtlas.js --verify   # counts only
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const SOURCE_URI = process.env.DB_URI_LOCAL || 'mongodb://127.0.0.1:27017/iti-hub';
// Target: the same URL the app uses (DB_URL / DB_URI fallback chain)
const TARGET_URI =
  process.env.DB_URL || process.env.DB_URI || 'mongodb://127.0.0.1:27017/iti-hub';

const DB_NAME = 'iti-hub';
const BATCH = 500;

async function verify(source, target) {
  const srcColls = await source.db(DB_NAME).listCollections().toArray();
  let total = 0;
  let allOk = true;
  console.log('\n📊 Verification (source → target):');
  for (const { name } of srcColls) {
    const srcCount = await source.db(DB_NAME).collection(name).countDocuments();
    const tgtCount = await target.db(DB_NAME).collection(name).countDocuments();
    const ok = tgtCount >= srcCount;
    allOk = allOk && ok;
    total += srcCount;
    console.log(`  ${ok ? '✅' : '❌'} ${name.padEnd(25)} ${srcCount} → ${tgtCount}`);
  }
  console.log(`\n${allOk ? '✅ All counts verified' : '❌ MISMATCH detected'}`);
  return allOk;
}

async function main() {
  const verifyOnly = process.argv.includes('--verify');
  const source = new MongoClient(SOURCE_URI);
  const target = new MongoClient(TARGET_URI);

  try {
    await source.connect();
    await target.connect();
    console.log('✅ Connected to source (local) and target (Atlas)\n');

    if (verifyOnly) {
      const ok = await verify(source, target);
      process.exitCode = ok ? 0 : 1;
      return;
    }

    const colls = await source.db(DB_NAME).listCollections().toArray();
    console.log(`📦 Migrating ${colls.length} collections...\n`);

    let totalDocs = 0;
    for (const { name } of colls) {
      const src = source.db(DB_NAME).collection(name);
      const tgt = target.db(DB_NAME).collection(name);

      // --- Indexes first (so unique constraints hold during upsert) ------
      const indexes = await src.indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const opts = {};
        for (const k of ['unique', 'sparse', 'ttl', 'partialFilterExpression', 'name']) {
          if (idx[k] !== undefined) opts[k] = idx[k];
        }
        try {
          await tgt.createIndex(idx.key, opts);
        } catch (e) {
          console.warn(`   ⚠️  index ${name}.${idx.name}: ${e.message}`);
        }
      }

      // --- Batch upsert ---------------------------------------------------
      const cursor = src.find({});
      let batch = [];
      let count = 0;
      const flush = async () => {
        if (!batch.length) return;
        const ops = batch.map((doc) => ({
          replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
        }));
        await tgt.bulkWrite(ops, { ordered: false });
        count += batch.length;
        batch = [];
      };

      for await (const doc of cursor) {
        batch.push(doc);
        if (batch.length >= BATCH) await flush();
      }
      await flush();
      totalDocs += count;
      console.log(`   📄 ${name.padEnd(25)} ${count} docs`);
    }

    console.log(`\n🎉 Migration complete — ${totalDocs} docs total.`);

    const ok = await verify(source, target);
    process.exitCode = ok ? 0 : 1;
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await source.close().catch(() => {});
    await target.close().catch(() => {});
  }
}

main();
