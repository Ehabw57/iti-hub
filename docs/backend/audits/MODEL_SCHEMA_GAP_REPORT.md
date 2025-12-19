# Model → Schema Gap Report

Generated: 2025-12-12

Scope
- Compare the repository Mongoose models in `server/models/*.js` against the canonical `docs/Database-Schema.md` and produce a prioritized list of gaps, index recommendations, and migration/action tasks.

Summary (high-level)
- The repository implements many core models: `User`, `Post`, `Comment`, `PostLike`, `CommentLike`, `Message`, `Conversation`, `Notification`, `Connection`, `Enrollment`, `Branch`, `Track`, and `Role`.
- Several model field names and shapes differ from the spec. Some required fields in the spec are missing. Some models enforce constraints not present in the spec (e.g. conversations limited to 2 participants). A few implementation bugs exist (see `Connection` index and `Role` export).

Risk: High priority gaps are auth/session differences, conversation limitations (no group chats), missing post fields (reposts/saves), and user profile fields/counts — they affect core functionality and feed behavior.

Per-model review

1) User (`server/models/User.js`)
---------------------------------
Repo fields (selected):
- `first_name`, `last_name`, `email`, `password`, `role` (enum includes student/instructor), `profile_pic`, timestamps
- Pre-save bcrypt hashing (saltRounds = 8)
- `generateAuthToken()` with expiry `2h`

Spec required fields (highlights):
- `username`, `email`, `password`, `fullName`, `bio`, `profilePicture`, `coverImage`, `specialization`, `location`, `role` (user|admin), `isBlocked`, counts (`followersCount`, `followingCount`, `postsCount`), `resetPasswordToken`, `resetPasswordExpires`, `lastSeen`.

Gaps / mismatches:
- Missing `username`, `fullName` (repo uses first_name/last_name instead), `bio`, `coverImage`, `specialization`, `location`.
- Missing denormalized counts (`followersCount`, `followingCount`, `postsCount`). These are important for feed and profile responses.
- Missing `isBlocked`, `blockReason` and password-reset fields `resetPasswordToken`, `resetPasswordExpires`.
- Password hashing salt rounds lower than spec (8 vs 10).
- JWT expiry shorter than spec (2h vs 7d); spec expects no refresh tokens in MVP and 7 days expiry.

Recommended actions:
- Add missing fields with sensible defaults to `UserSchema`.
- Standardize on either `first_name`/`last_name` or a single `fullName`/`username` pair (prefer spec: `username`, `fullName`). Add virtuals if you want to preserve both.
- Increase bcrypt salt rounds to 10 (or configurable via env). Make the rounds driven by `process.env.BCRYPT_ROUNDS`.
- Change token expiry to `7d` (configurable via env `JWT_EXPIRES_IN`). Update tests accordingly.
- Add `resetPasswordToken` and `resetPasswordExpires` (select: false) and implement password reset flow.
- Add `followersCount`, `followingCount`, `postsCount` fields and update write paths (connection creation/removal, post creation/deletion) to maintain counts.

Migration notes:
- Add fields to schema (non-destructive). For counts, run migration to set counts using aggregation pipelines (e.g., count connections and posts per user) and then update documents.
- Example migration (pseudo):
  - Use `db.collection('connections').aggregate([{ $group: { _id: "$recipient_id", count: {$sum:1} } }])` to compute followersCount and update users.


2) Post (`server/models/Post.js`)
---------------------------------
Repo fields: `author_id`, `track_id`, `branch_id`, `content`, `media` (url/type), `likes_count`, `comments_count`.

Spec required (highlights): `images` (max 10), `tags` (controlled list), `community` association, `type` (text/question/project), `repostsCount`, `savesCount`, `isRepost`, `originalPost`, `isDeleted`, `deletedBy`, `editedAt`, text length constraints.

Gaps / mismatches:
- Missing `tags`, `type` enum as specified, `repostsCount`, `savesCount`, repost metadata (`isRepost`, `originalPost`), `isDeleted`/moderation fields, `editedAt`.
- `media.type` enum differs (`photo|video|file`) — spec expects images for MVP; repo allows videos/files.

Recommended actions:
- Extend Post schema with `tags` (ObjectId refs to `Tag`), `type` enum, repost fields, `savesCount`, `isDeleted` and moderation fields.
- Add indexes: `{ author_id:1, createdAt:-1 }`, `{ track_id:1, branch_id:1, createdAt:-1 }`, text index on `content`.

Migration notes:
- Add `isDeleted: false`, `repostsCount:0`, `savesCount:0` default fields. Backfill `repostsCount` if reposts tracked in separate collection.


3) Comment (`server/models/Comment.js`)
--------------------------------------
Repo fields: `post_id`, `author_id`, `content`, `parent_comment_id`, `image_url`, `likes_count`, `reply_count`.

Spec fields: similar but expects `repliesCount`, `isDeleted`, `deletedBy`, `deletedAt` and `1-1000 char` validation.

Gaps:
- Missing soft-delete fields and possibly `isDeleted` indexing.

Recommendations:
- Add `isDeleted`, `deletedBy`, `deletedAt` and ensure reply_count maintained.


4) PostLike / CommentLike
-------------------------
Repo implements these with unique compound indexes — good and aligned with spec. No action required except to verify naming conventions and consistent ref names.


5) Connection (`server/models/Connection.js`)
-------------------------------------------
Repo fields: `requester_id`, `recipient_id`, `status` (pending/accepted/blocked). Index declared: `{ user_id: 1, connected_user_id: 1 }` but these fields do not exist in the schema — bug.

Spec expects: `follower`, `following` with unique compound `{ follower:1, following:1 }` and cascade increment/decrement of counts.

Gaps / fixes:
- Fix index to use `{ requester_id:1, recipient_id:1 }` unique.
- Consider renaming fields to `follower`/`following` for clarity or keep current names but document mapping.
- Implement count updates on create/delete.

Migration:
- Create unique index on `{ requester_id, recipient_id }` and clean duplicates if any.


6) Conversation & Message (`server/models/Conversation.js`, `Message.js`)
---------------------------------------------------------------------
Repo conversation enforces exactly 2 participants (individual only). Spec supports `type: individual|group`, group admin, name, up to 100 participants.

Message repo lacks `status` enum (sent/delivered/seen) and seenBy objects with timestamps; it uses `seen_by` array of user ids.

Gaps:
- Add `type`, `name`, `image`, `admin` to Conversation. Relax participant count validation.
- Add `status` to Message and `seenBy` entries with timestamps (objects { userId, seenAt }). Optionally keep `seen_by` array but extend structure.

Recommendation:
- Update Conversation schema to support groups and keep current conversations intact; default existing docs to `type: individual`.

Migration:
- Migrate `seen_by` array to `seenBy` array of objects with `seenAt = conversation last updated` if exact timestamps unavailable.


7) Notification (`server/models/Notification.js`)
------------------------------------------------
Repo fields: `type`, `sender_id`, `receiver_id`, `entity_id`, `is_read`.

Spec expects fields similar but also `reference` polymorphic data and batch notification behavior. Repo indexes for unread counts are present — good.

Gaps:
- Consider renaming `receiver_id` → `recipient` and `sender_id` → `actor` to match spec (optional).
- Include `reference` with typed object ref (post/comment/user) for clarity.


8) Enrollment, Branch, Track
----------------------------
Repo includes `Enrollment`, `Branch`, `Track` models — they appear to be used for organizing users into tracks/branches (maybe internal to the project). They aren't directly in the spec but can map to communities. No immediate changes required unless you want to model `Communities` separately.


9) Role (`server/models/Role.js`)
--------------------------------
Repo bug: uses `model.exports = ...` instead of `module.exports` — this will break role model import. Fix is required.


Index recommendations (global)
- Users: unique indexes on `email`, `username` (add username). Indexes on `createdAt`, `lastSeen`.
- Posts: `{ author_id:1, createdAt:-1 }`, `{ track_id:1, branch_id:1, createdAt:-1 }`, text index on `content`.
- Comments: `{ post_id:1, parent_comment_id:1, createdAt:-1 }` (exists).
- Messages: `{ conversation_id:1, createdAt:-1 }` (exists).
- Connections: `{ requester_id:1, recipient_id:1 }` unique.


Action plan & priority (concrete tasks)
---------------------------------------
P0 (High)
- Fix `Role` export bug. (1 file, patch)
- Fix `Connection` index and add unique compound index on `requester_id,recipient_id`. (1 file + DB migration to remove duplicates)
- Add password reset fields & endpoints; increase JWT expiry to 7d and bcrypt rounds to env-driven value. (authController + User model)
- Add followers/following counts and ensure connection create/delete update counts. (Connection controller + hooks)

P1 (Medium)
- Expand `Post` schema: tags, type, savesCount, repost fields, isDeleted + moderation metadata and add recommended indexes.
- Extend `Conversation` and `Message` schemas to support group conversations and message status/seen metadata.
- Add `username`, `bio`, `specialization`, `location`, `coverImage`, `lastSeen` to `User` model and backfill where feasible.

P2 (Low)
- Align naming to spec (actor/recipient vs sender_id/receiver_id) (cosmetic).
- Add a `Tag` model and seed recommended tags.


Sample migration snippets (examples)
----------------------------------
1) Fix Role export (code patch) — small PR

2) Add default fields (example using mongoose):
```js
// run once in a migration script
const User = require('./server/models/User');
await User.updateMany({ username: { $exists: false } }, { $set: { username: null } });
await User.updateMany({}, { $set: { followersCount: 0, followingCount: 0, postsCount: 0, isBlocked: false } });
```

3) Build counts via aggregation (followers):
```js
const counts = await Connection.aggregate([
  { $match: { status: 'accepted' } },
  { $group: { _id: '$recipient_id', count: { $sum: 1 } } }
]);
for (const c of counts) {
  await User.updateOne({ _id: c._id }, { $set: { followersCount: c.count } });
}
```
