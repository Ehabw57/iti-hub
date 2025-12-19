# Database Schema Specification

**Project**: ITI Hub Social Media Platform  
**Database**: MongoDB  
**Version**: 1.0 (MVP)  
**Date**: December 12, 2025

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [User Schema](#user-schema)
3. [Post Schema](#post-schema)
4. [Comment Schema](#comment-schema)
5. [Community Schema](#community-schema)
6. [Conversation Schema](#conversation-schema)
7. [Message Schema](#message-schema)
8. [Notification Schema](#notification-schema)
9. [Report Schema](#report-schema)
10. [Connection Schema](#connection-schema)
11. [PostLike Schema](#postlike-schema)
12. [CommentLike Schema](#commentlike-schema)
13. [SavedPost Schema](#savedpost-schema)
14. [Tag Schema](#tag-schema)
15. [Indexes](#indexes)
16. [Data Relationships](#data-relationships)

---

## Schema Overview

### Database Configuration

**MongoDB Setup**: Single instance (no replica set required for MVP)  
**Transactions**: Not used in MVP (application-level consistency)  
**Consistency Strategy**: Eventual consistency with careful cascade operations

**Rationale for No Transactions:**
- MongoDB transactions require replica set configuration
- Adds complexity to deployment and development setup
- MVP can handle consistency at application level
- Most operations are single-document (atomic by default)
- Multi-document operations use careful ordering and error handling

**Critical Operations Handled with Care:**
- User deletion: Cascade deletes handled in service layer with rollback logic
- Community deletion: Mark as deleted first, cleanup in background job

### Collections Summary

| Collection | Purpose | Estimated Documents |
|------------|---------|---------------------|
| users | User accounts and profiles | 10,000+ |
| posts | User posts and content | 100,000+ |
| comments | Comments and replies | 500,000+ |
| communities | Community pages | 50-100 |
| conversations | Chat conversations | 50,000+ |
| messages | Individual messages | 1,000,000+ |
| notifications | User notifications | 500,000+ |
| reports | Content reports | 1,000+ |
| connections | Follow relationships | 100,000+ |
| postLikes | Post like records | 500,000+ |
| commentLikes | Comment like records | 200,000+ |
| savedPosts | Saved post records | 50,000+ |
| tags | Predefined tag list | 50-100 |

---

## User Schema

**Collection**: `users`

```javascript
{
  _id: ObjectId,
  username: String,           // Unique, lowercase, 3-30 chars
  email: String,              // Unique, lowercase, valid email
  password: String,           // Bcrypt hashed (never return in API)
  fullName: String,           // 2-100 chars
  bio: String,                // Max 500 chars, default: ""
  profilePicture: String,     // URL, default: null
  coverImage: String,         // URL, default: null
  specialization: String,     // e.g., "Full-Stack Developer", default: null
  location: String,           // e.g., "Cairo, Egypt", default: null
  
  // Role and status
  role: String,               // Enum: "user", "admin", default: "user"
  isBlocked: Boolean,         // Default: false
  blockReason: String,        // Admin note, default: null
  
  // Counts (denormalized for performance)
  followersCount: Number,     // Default: 0
  followingCount: Number,     // Default: 0
  postsCount: Number,         // Default: 0
  
  // Password reset
  resetPasswordToken: String,  // Hashed token, default: null
  resetPasswordExpires: Date,  // Token expiration, default: null
  
  // Timestamps
  createdAt: Date,            // Auto-generated
  updatedAt: Date,            // Auto-updated
  lastSeen: Date              // Updated on activity, default: now
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Unique indexes
{ username: 1 }  // Unique
{ email: 1 }     // Unique

// Query indexes
{ role: 1 }
{ isBlocked: 1 }
{ createdAt: -1 }
{ lastSeen: -1 }

// Text search
{ username: "text", fullName: "text", specialization: "text" }
```

### Validation Rules

- `username`: Regex `/^[a-z0-9_]{3,30}$/`, unique, required
- `email`: Valid email format, unique, required
- `password`: Min 8 chars, bcrypt hashed, required
- `fullName`: Min 2 chars, max 100, required
- `bio`: Max 500 chars
- `role`: Enum ["user", "admin"]

---

## Post Schema

**Collection**: `posts`

```javascript
{
  _id: ObjectId,
  author: ObjectId,           // Ref: users
  content: String,            // Max 5000 chars, required if no images
  images: [String],           // Array of URLs
  
  // Community association
  community: ObjectId,        // Ref: communities, default: null
  
  // Tags
  tags: [ObjectId],           // Ref: tags, max 5
  
  // Counts (denormalized)
  likesCount: Number,         // Default: 0
  commentsCount: Number,      // Default: 0
  repostsCount: Number,       // Default: 0
  savesCount: Number,         // Default: 0
  
  // Repost info (if this is a repost)
  isRepost: Boolean,          // Default: false
  originalPost: ObjectId,     // Ref: posts, default: null
  repostComment: String,      // Optional comment on repost, max 500 chars
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
}
```

### Post Edit Rules

**Important**: Posts can be edited at any time with the following restrictions:
- ✅ **Can be updated**: `content`, `tags`
- ❌ **Cannot be updated**: `images` (delete and recreate post to change images)
- 📝 **Edit tracking**: `editedAt` timestamp updated on every edit
- 🔒 **Permissions**: Owner, moderators (in community), and admins can edit
- ℹ️ **No edit indicator**: No visual "edited" badge shown to users

### Indexes

```javascript
// Primary
{ _id: 1 }

// Query indexes
{ author: 1, createdAt: -1 }
{ community: 1, createdAt: -1 }
{ type: 1, createdAt: -1 }
{ tags: 1, createdAt: -1 }
{ createdAt: -1 }
{ originalPost: 1 }  // For reposts

// Compound indexes for feed
{ author: 1, , createdAt: -1 }
{ community: 1, createdAt: -1 }

// Text search
{ content: "text" }
```

### Validation Rules

- `author`: Required, valid ObjectId
- `content`: Max 5000 chars, required if `images` is empty
- `tags`: Max 5 ObjectIds
- `repostComment`: Max 500 chars

---

## Comment Schema

**Collection**: `comments`

```javascript
{
  _id: ObjectId,
  post: ObjectId,             // Ref: posts, required
  author: ObjectId,           // Ref: users, required
  content: String,            // 1-1000 chars, required
  
  // Reply info
  parentComment: ObjectId,    // Ref: comments, null if top-level
  
  // Counts
  likesCount: Number,         // Default: 0
  repliesCount: Number,       // Default: 0 (only for top-level)
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Query indexes
{ post: 1, createdAt: -1 }
{ author: 1, createdAt: -1 }
{ parentComment: 1, createdAt: 1 }  // Get replies

// Compound
{ post: 1, parentComment: 1, createdAt: -1 }
```

### Validation Rules

- `post`: Required, valid ObjectId
- `author`: Required, valid ObjectId
- `content`: Required, 1-1000 chars
- `parentComment`: If set, must reference existing top-level comment

### Business Logic

- Replies can only be one level deep (no nested replies to replies)
- Only top-level comments can have replies

---

## Community Schema

**Collection**: `communities`

```javascript
{
  _id: ObjectId,
  name: String,               // Unique, 2-100 chars, required
  description: String,        // Max 1000 chars, required
  coverImage: String,         // URL, default: null
  rules: String,              // Markdown, max 5000 chars, default: ""
  
  // Tags
  tags: [ObjectId],           // Ref: tags
  
  // Counts
  membersCount: Number,       // Default: 0
  postsCount: Number,         // Default: 0
  
  // Moderation
  moderators: [ObjectId],     // Ref: users, array of moderator IDs
  
  // Creator
  createdBy: ObjectId,        // Ref: users (admin who created)
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Unique
{ name: 1 }  // Unique

// Query indexes
{ createdAt: -1 }
{ membersCount: -1 }
{ tags: 1 }

// Text search
{ name: "text", description: "text" }
```

### Validation Rules

- `name`: Required, unique, 2-100 chars
- `description`: Required, max 1000 chars
- `rules`: Max 5000 chars
- `moderators`: Array of valid user ObjectIds

---

## Conversation Schema

**Collection**: `conversations`

```javascript
{
  _id: ObjectId,
  type: String,               // Enum: "individual", "group", required
  
  // Participants
  participants: [ObjectId],   // Ref: users, min 2, max 100
  
  // Group-specific fields
  name: String,               // Group name, required if type="group"
  image: String,              // Group image URL, optional
  admin: ObjectId,            // Ref: users, required if type="group"
  
  // Last message info (denormalized for performance)
  lastMessage: {
    id: ObjectId,             // Message ID
    content: String,          // Message preview
    sender: ObjectId,         // Ref: users
    createdAt: Date
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date             // Updated when new message sent
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Query indexes
{ participants: 1, updatedAt: -1 }
{ type: 1 }
{ admin: 1 }
{ updatedAt: -1 }

// Compound for finding conversation by participants
{ participants: 1, type: 1 }
```

### Validation Rules

- `type`: Required, enum ["individual", "group"]
- `participants`: Required, min 2, max 100 ObjectIds
- `name`: Required if type="group", 2-100 chars
- `admin`: Required if type="group"

### Business Logic

- Individual conversations: exactly 2 participants
- Group conversations: 3-100 participants
- Participant array must be sorted for consistent querying

---

## Message Schema

**Collection**: `messages`

```javascript
{
  _id: ObjectId,
  conversation: ObjectId,     // Ref: conversations, required
  sender: ObjectId,           // Ref: users, required
  
  // Content
  content: String,            // Max 2000 chars, required if no image
  image: String,              // URL, optional
  
  // Status tracking
  status: String,             // Enum: "sent", "delivered", "seen"
  seenBy: [{
    user: ObjectId,           // Ref: users
    seenAt: Date
  }],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Query indexes
{ conversation: 1, createdAt: -1 }
{ sender: 1, createdAt: -1 }
{ status: 1 }

// Compound for pagination
{ conversation: 1, createdAt: -1 }
```

### Validation Rules

- `conversation`: Required, valid ObjectId
- `sender`: Required, valid ObjectId
- `content`: Max 2000 chars, required if no `image`
- `status`: Enum ["sent", "delivered", "seen"], default: "sent"

---

## Notification Schema

**Collection**: `notifications`

```javascript
{
  _id: ObjectId,
  recipient: ObjectId,        // Ref: users, required
  type: String,               // Enum: notification types, required
  
  // Actor (who triggered the notification)
  actor: ObjectId,            // Ref: users, required
  reference: OjectId, //Ref: post, comment
  
  // Status
  isRead: Boolean,            // Default: false
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Types

- `like`: Actor liked recipient's post
- `comment`: Actor commented on recipient's post
- `reply`: Actor replied to recipient's comment
- `repost`: Actor reposted recipient's post
- `follow`: Actor followed recipient

### Indexes

```javascript
// Primary
{ _id: 1 }

// Query indexes
{ recipient: 1, createdAt: -1 }
{ recipient: 1, isRead: 1, createdAt: -1 }
{ type: 1 }
{ actor: 1 }

// Compound for unread count
{ recipient: 1, isRead: 1 }
```

### Validation Rules

- `recipient`: Required, valid ObjectId
- `actor`: Required, valid ObjectId
- `type`: Required, enum ["like", "comment", "reply", "repost", "follow"]

### Business Logic

- Don't create notification if actor = recipient (own actions)
- Batch similar notifications (e.g., "X and 5 others liked your post")

---

## Report Schema

**Collection**: `reports`

```javascript
{
  _id: ObjectId,
  reporter: ObjectId,         // Ref: users, required
  type: String,               // Enum: "post", "comment", "user"
  
  // Reported content (polymorphic)
  reference: ObjectId,          // Ref: post or comments, user
  
  // Report details
  reason: String,             // Enum: reasons, required
  description: String,        // Max 500 chars, optional
  
  // Status and resolution
  status: String,             // Enum: statuses, default: "pending"
  reviewedBy: ObjectId,       // Ref: users (admin), default: null
  reviewedAt: Date,           // Default: null
  action: String,             // Enum: actions, default: null
  adminNote: String,          // Admin comment, max 1000 chars
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Enums

**Reasons:**
- `spam`: Spam or advertising
- `harassment`: Harassment or bullying
- `inappropriate`: Inappropriate content
- `misinformation`: False information
- `other`: Other reason

**Statuses:**
- `pending`: Awaiting review
- `resolved`: Action taken
- `dismissed`: No action needed

**Actions:**
- `dismiss`: No action taken
- `delete_content`: Content deleted
- `warn_user`: User warned
- `block_user`: User blocked

### Indexes

```javascript
// Primary
{ _id: 1 }

// Query indexes
{ status: 1, createdAt: -1 }
{ type: 1, status: 1 }
{ reporter: 1 }
{ reviewedBy: 1 }
{ post: 1 }
{ comment: 1 }
{ user: 1 }
```

### Validation Rules

- `reporter`: Required, valid ObjectId
- `type`: Required, enum ["post", "comment", "user"]
- `reason`: Required, enum (see above)
- `description`: Max 500 chars
- Must have exactly one of: `post`, `comment`, or `user` set

---

## Connection Schema

**Collection**: `connections`

**Purpose**: Track follow relationships between users

```javascript
{
  _id: ObjectId,
  follower: ObjectId,         // Ref: users, the user who follows
  following: ObjectId,        // Ref: users, the user being followed
  
  // Timestamps
  createdAt: Date
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Unique compound (prevent duplicate follows)
{ follower: 1, following: 1 }  // Unique

// Query indexes
{ follower: 1, createdAt: -1 }   // Get user's following list
{ following: 1, createdAt: -1 }  // Get user's followers list
```

### Validation Rules

- `follower`: Required, valid ObjectId
- `following`: Required, valid ObjectId
- `follower` !== `following` (cannot follow yourself)

### Business Logic

- When created: increment `followingCount` for follower, `followersCount` for following
- When deleted: decrement counts
- Can not follow the same user more than once
- Create notification for following user

---

## PostLike Schema

**Collection**: `postLikes`

**Purpose**: Track post likes

```javascript
{
  _id: ObjectId,
  user: ObjectId,             // Ref: users, required
  post: ObjectId,             // Ref: posts, required
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Unique compound
{ user: 1, post: 1 }  // Unique

// Query indexes
{ user: 1, createdAt: -1 }
{ post: 1, createdAt: -1 }
```

### Business Logic

- When created: increment `likesCount` in post, create notification
- When deleted: decrement `likesCount`

---

## CommentLike Schema

**Collection**: `commentLikes`

**Purpose**: Track comment likes

```javascript
{
  _id: ObjectId,
  user: ObjectId,             // Ref: users, required
  comment: ObjectId,          // Ref: comments, required
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Unique compound
{ user: 1, comment: 1 }  // Unique

// Query indexes
{ user: 1, createdAt: -1 }
{ comment: 1, createdAt: -1 }
```

### Business Logic

- When created: increment `likesCount` in comment, create notification
- When deleted: decrement `likesCount`

---

## SavedPost Schema

**Collection**: `savedPosts`

**Purpose**: Track saved posts (bookmarks)

```javascript
{
  _id: ObjectId,
  user: ObjectId,             // Ref: users, required
  post: ObjectId,             // Ref: posts, required
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Unique compound
{ user: 1, post: 1 }  // Unique

// Query indexes
{ user: 1, createdAt: -1 }
{ post: 1 }
```

### Business Logic

- When created: increment `savesCount` in post
- When deleted: decrement `savesCount`
- No notification created
- can not save the same post by the same user more than once

---

## Tag Schema

**Collection**: `tags`

**Purpose**: Controlled list of predefined tags

```javascript
{
  _id: ObjectId,
  name: String,               // Unique, lowercase, required
  displayName: String,        // Display name with proper casing
  category: String,           // E.g., "language", "framework", "topic"
  usageCount: Number,         // How many posts use this tag, default: 0
  
  // Metadata
  isActive: Boolean,          // Can be used in new posts, default: true
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Unique
{ name: 1 }  // Unique

// Query indexes
{ category: 1, name: 1 }
{ isActive: 1 }
{ usageCount: -1 }
```

### Example Tags

```javascript
[
  { name: "javascript", displayName: "JavaScript", category: "language" },
  { name: "python", displayName: "Python", category: "language" },
  { name: "react", displayName: "React", category: "framework" },
  { name: "nodejs", displayName: "Node.js", category: "framework" },
  { name: "webdev", displayName: "Web Development", category: "topic" },
  { name: "career", displayName: "Career", category: "topic" },
  { name: "tutorial", displayName: "Tutorial", category: "content-type" },
  { name: "question", displayName: "Question", category: "content-type" },
  { name: "project-showcase", displayName: "Project Showcase", category: "content-type" }
]
```

---

## Community Membership

**Collection**: `communityMembers`

**Purpose**: Track user membership in communities

```javascript
{
  _id: ObjectId,
  user: ObjectId,             // Ref: users, required
  community: ObjectId,        // Ref: communities, required
  role: String,               // Enum: "member", "moderator", default: "member"
  
  // Timestamps
  createdAt: Date
}
```

### Indexes

```javascript
// Primary
{ _id: 1 }

// Unique compound
{ user: 1, community: 1 }  // Unique

// Query indexes
{ user: 1, role: 1 }
{ community: 1, joinedAt: -1 }
{ community: 1, role: 1 }
```

### Business Logic

- When created: increment `membersCount` in community
- When deleted: decrement `membersCount`
- Moderators have `role: "moderator"`

---

## Data Relationships

### Relationship Diagram

```
User ────────< Post (author)
  │           ╱  │  ╲
  │          ╱   │   ╲
  │         ╱    │    ╲
  │    PostLike  │   SavedPost
  │              │
  │              └────< Comment ────< CommentLike
  │                       │
  │                       └────< Comment (replies)
  │
  ├────< Connection (follower/following)
  ├────< Notification (recipient/actor)
  ├────< Message (sender)
  ├────< Report (reporter)
  └────< CommunityMember ────> Community
                                    │
                                    └────< Post (community)

Conversation ────< Message
     │
     └────< User (participants)

Tag ────< Post.tags
```

### Referential Integrity

**Cascade Delete Rules:**

When a **User** is deleted:
- Delete all their posts
- Delete all their comments
- Delete all their connections (both directions)
- Delete all their likes (post and comment)
- Delete all their saved posts
- Delete all their messages
- Delete notifications where user is actor or recipient
- Remove from community memberships
- Remove from conversation participants

When a **Post** is deleted:
- Keep comments but mark as orphaned (optional)
- Delete all post likes
- Delete all saved post records
- Delete notifications related to this post

When a **Community** is deleted:
- Delete all community memberships
- Set `community: null` in posts (or delete posts)
- Delete moderator assignments

---

## Database Optimization Strategies

### Denormalization

To improve read performance, we denormalize counts:

- `User.followersCount`, `User.followingCount`, `User.postsCount`
- `Post.likesCount`, `Post.commentsCount`, `Post.repostsCount`, `Post.savesCount`
- `Comment.likesCount`, `Comment.repliesCount`
- `Community.membersCount`, `Community.postsCount`
- `Tag.usageCount`

**Trade-off**: Requires careful transaction handling to keep counts accurate.


### Query Optimization

- Use projection to fetch only needed fields
- Implement pagination everywhere (prevent large result sets)
- Use compound indexes for common query patterns
- Use `lean()` in Mongoose for read-only queries (faster)

---

## Mongoose Schema Examples

### User Model (Mongoose)

```javascript
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-z0-9_]+$/
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: { 
    type: String, 
    required: true,
    select: false  // Don't include in queries by default
  },
  fullName: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  bio: { 
    type: String, 
    default: '',
    maxlength: 500
  },
  profilePicture: { 
    type: String, 
    default: null 
  },
  coverImage: { 
    type: String, 
    default: null 
  },
  specialization: { 
    type: String, 
    default: null,
    maxlength: 100
  },
  location: { 
    type: String, 
    default: null,
    maxlength: 100
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  isBlocked: { 
    type: Boolean, 
    default: false 
  },
  blockReason: { 
    type: String, 
    default: null 
  },
  followersCount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  followingCount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  postsCount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  resetPasswordToken: { 
    type: String, 
    default: null,
    select: false
  },
  resetPasswordExpires: { 
    type: Date, 
    default: null,
    select: false
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isBlocked: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastSeen: -1 });
UserSchema.index({ username: 'text', fullName: 'text', specialization: 'text' });

module.exports = mongoose.model('User', UserSchema);
```

---

**End of Database Schema Specification**
