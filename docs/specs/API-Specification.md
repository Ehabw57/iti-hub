# API Specification

**Project**: ITI Hub Social Media Platform  
**Version**: 1.0 (MVP)  
**Base URL**: `/api/v1`  
**Date**: December 12, 2025

---

## Table of Contents

1. [General API Information](#general-api-information)
2. [Authentication Endpoints](#authentication-endpoints)
3. [User Endpoints](#user-endpoints)
4. [Post Endpoints](#post-endpoints)
5. [Comment Endpoints](#comment-endpoints)
6. [Community Endpoints](#community-endpoints)
7. [Feed Endpoints](#feed-endpoints)
8. [Messaging Endpoints](#messaging-endpoints)
9. [Notification Endpoints](#notification-endpoints)
10. [Search Endpoints](#search-endpoints)
11. [Admin Endpoints](#admin-endpoints)
12. [Report Endpoints](#report-endpoints)

---

## General API Information

### Authentication
All endpoints except public endpoints require JWT token in header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": { }
  }
}
```

**Validation Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "password": "Must be at least 8 characters"
      }
    }
  }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Common Query Parameters
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Items per page
- `sortBy` (string): Field to sort by
- `order` (string: 'asc' | 'desc', default: 'desc'): Sort order

---

## Authentication Endpoints

### 1. Register User

**Endpoint**: `POST /auth/register`  
**Auth Required**: No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "johndoe",
  "fullName": "John Doe"
}
```

**Validation Rules:**
- `email`: Valid email format, unique in database
- `password`: Min 8 chars, must contain uppercase, lowercase, number
- `username`: 3-30 chars, alphanumeric + underscore, unique
- `fullName`: 2-100 chars

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "userId123",
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "createdAt": "2025-12-12T10:00:00Z"
    }
  },
  "message": "Registration successful. Please login."
}
```

**Error Responses:**
- `400`: Validation error
- `409`: Email or username already exists

---

### 2. Login User

**Endpoint**: `POST /auth/login`  
**Auth Required**: No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "userId123",
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "profilePicture": "https://...",
      "role": "user"
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `400`: Invalid email or password format
- `401`: Incorrect credentials
- `403`: Account blocked

---

### 3. Request Password Reset

**Endpoint**: `POST /auth/password-reset/request`  
**Auth Required**: No

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If email exists, reset link has been sent"
}
```

*Note: Always returns success to prevent email enumeration*

---

### 4. Reset Password

**Endpoint**: `POST /auth/password-reset/confirm`  
**Auth Required**: No

**Request Body:**
```json
{
  "token": "resetToken123",
  "newPassword": "NewSecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Error Responses:**
- `400`: Invalid or expired token
- `400`: Password validation failed

---

## User Endpoints

### 5. Get User Profile

**Endpoint**: `GET /users/:userId`  
**Auth Required**: Yes (public profile) / No (limited data)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "userId123",
    "username": "johndoe",
    "fullName": "John Doe",
    "bio": "Software developer passionate about web tech",
    "profilePicture": "https://...",
    "coverImage": "https://...",
    "specialization": "Full-Stack Development",
    "location": "Cairo, Egypt",
    "followersCount": 150,
    "followingCount": 80,
    "postsCount": 45,
    "isFollowing": true,
    "isBlocked": false,
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

**Error Responses:**
- `404`: User not found

---

### 6. Update User Profile

**Endpoint**: `PATCH /users/me`  
**Auth Required**: Yes (own profile only)

**Request Body:**
```json
{
  "fullName": "John Updated Doe",
  "bio": "Updated bio text",
  "specialization": "DevOps Engineer",
  "location": "Alexandria, Egypt",
  "profilePicture": "https://...",
  "coverImage": "https://..."
}
```

**Validation Rules:**
- `fullName`: 2-100 chars (optional)
- `bio`: Max 500 chars (optional)
- `specialization`: Max 100 chars (optional)
- `location`: Max 100 chars (optional)
- `profilePicture`, `coverImage`: Valid URL (optional)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { /* updated user object */ }
  },
  "message": "Profile updated successfully"
}
```

---

### 7. Follow User

**Endpoint**: `POST /users/:userId/follow`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "followersCount": 151
  },
  "message": "User followed successfully"
}
```

**Error Responses:**
- `400`: Cannot follow yourself
- `404`: User not found
- `409`: Already following

---

### 8. Unfollow User

**Endpoint**: `DELETE /users/:userId/follow`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isFollowing": false,
    "followersCount": 150
  },
  "message": "User unfollowed successfully"
}
```

---

### 9. Block User

**Endpoint**: `POST /users/:userId/block`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

*Note: Automatically unfollows both ways*

---

### 10. Unblock User

**Endpoint**: `DELETE /users/:userId/block`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

### 11. Get User's Followers

**Endpoint**: `GET /users/:userId/followers`  
**Auth Required**: Yes  
**Query Params**: `page`, `limit`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "userId456",
      "username": "janedoe",
      "fullName": "Jane Doe",
      "profilePicture": "https://...",
      "isFollowing": false
    }
  ],
  "pagination": { /* pagination object */ }
}
```

---

### 12. Get User's Following

**Endpoint**: `GET /users/:userId/following`  
**Auth Required**: Yes  
**Query Params**: `page`, `limit`

**Success Response (200):** Same as followers

---

## Post Endpoints

### 13. Create Post

**Endpoint**: `POST /posts`  
**Auth Required**: Yes

**Request Body:**
```json
{
  "content": "Post content text here",
  "images": [
    "https://image1.url",
    "https://image2.url"
  ],
  "tags": ["javascript", "webdev"],
  "communityId": "communityId123",
  "type": "text"
}
```

**Validation Rules:**
- `content`: Required if no images, max 5000 chars
- `images`: Array, max 10 URLs, each valid image URL
- `tags`: Array, max 5 tags, each from controlled list
- `communityId`: Optional, must be valid community ID
- `type`: Enum: "text", "question", "project"

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "postId123",
      "author": {
        "id": "userId123",
        "username": "johndoe",
        "fullName": "John Doe",
        "profilePicture": "https://..."
      },
      "content": "Post content text here",
      "images": ["https://..."],
      "tags": ["javascript", "webdev"],
      "community": {
        "id": "communityId123",
        "name": "JavaScript Developers"
      },
      "type": "text",
      "likesCount": 0,
      "commentsCount": 0,
      "repostsCount": 0,
      "isLiked": false,
      "isSaved": false,
      "createdAt": "2025-12-12T10:30:00Z",
      "updatedAt": "2025-12-12T10:30:00Z"
    }
  },
  "message": "Post created successfully"
}
```

**Error Responses:**
- `400`: Validation error
- `404`: Community not found
- `429`: Rate limit exceeded (10 posts/hour)

---

### 14. Get Post by ID

**Endpoint**: `GET /posts/:postId`  
**Auth Required**: Optional (public access with limited data)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "post": { /* post object with full details */ }
  }
}
```

---

### 15. Update Post

**Endpoint**: `PATCH /posts/:postId`  
**Auth Required**: Yes (own post, moderator, or admin)

**Request Body:**
```json
{
  "content": "Updated content",
  "tags": ["updated", "tags"]
}
```

**Validation Rules:**
- Only `content` and `tags` can be updated
- `images` cannot be updated (delete and recreate post to change images)
- No time limit for editing (can edit anytime)
- Moderators can edit posts in their assigned communities
- Admins can edit any post

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "post": {
      /* updated post object */
      "editedAt": "2025-12-12T11:00:00Z"
    }
  },
  "message": "Post updated successfully"
}
```

**Error Responses:**
- `400`: Attempting to update images (not allowed)
- `403`: Not authorized to edit (not owner, moderator, or admin)
- `404`: Post not found

---

### 16. Delete Post

**Endpoint**: `DELETE /posts/:postId`  
**Auth Required**: Yes (own post, moderator, or admin)

**Success Response (204):** No content

**Error Responses:**
- `403`: Not authorized to delete
- `404`: Post not found

---

### 17. Like Post

**Endpoint**: `POST /posts/:postId/like`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likesCount": 42
  }
}
```

---

### 18. Unlike Post

**Endpoint**: `DELETE /posts/:postId/like`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isLiked": false,
    "likesCount": 41
  }
}
```

---

### 19. Save Post

**Endpoint**: `POST /posts/:postId/save`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isSaved": true
  }
}
```

---

### 20. Unsave Post

**Endpoint**: `DELETE /posts/:postId/save`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isSaved": false
  }
}
```

---

### 21. Repost

**Endpoint**: `POST /posts/:postId/repost`  
**Auth Required**: Yes

**Request Body (optional):**
```json
{
  "comment": "Check this out!"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "repost": {
      "id": "repostId123",
      "originalPost": { /* original post object */ },
      "comment": "Check this out!",
      "createdAt": "2025-12-12T11:00:00Z"
    }
  }
}
```

---

### 22. Get User's Posts

**Endpoint**: `GET /users/:userId/posts`  
**Auth Required**: Optional  
**Query Params**: `page`, `limit`, `type`

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of post objects */ ],
  "pagination": { /* pagination object */ }
}
```

---

### 23. Get Saved Posts

**Endpoint**: `GET /users/me/saved-posts`  
**Auth Required**: Yes  
**Query Params**: `page`, `limit`

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of saved post objects */ ],
  "pagination": { /* pagination object */ }
}
```

---

## Comment Endpoints

### 24. Create Comment

**Endpoint**: `POST /posts/:postId/comments`  
**Auth Required**: Yes

**Request Body:**
```json
{
  "content": "Great post! Thanks for sharing."
}
```

**Validation Rules:**
- `content`: Required, 1-1000 chars

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "commentId123",
      "author": {
        "id": "userId123",
        "username": "johndoe",
        "profilePicture": "https://..."
      },
      "content": "Great post! Thanks for sharing.",
      "likesCount": 0,
      "repliesCount": 0,
      "isLiked": false,
      "createdAt": "2025-12-12T11:30:00Z"
    }
  }
}
```

---

### 25. Reply to Comment

**Endpoint**: `POST /comments/:commentId/replies`  
**Auth Required**: Yes

**Request Body:**
```json
{
  "content": "I agree with this!"
}
```

**Success Response (201):** Same structure as comment

*Note: Only one level of replies allowed*

---

### 26. Get Post Comments

**Endpoint**: `GET /posts/:postId/comments`  
**Auth Required**: Optional  
**Query Params**: `page`, `limit`, `sortBy` (createdAt, likesCount)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "commentId123",
      "author": { /* author object */ },
      "content": "Comment text",
      "likesCount": 5,
      "repliesCount": 2,
      "isLiked": true,
      "replies": [
        { /* reply objects */ }
      ],
      "createdAt": "2025-12-12T11:30:00Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

---

### 27. Delete Comment

**Endpoint**: `DELETE /comments/:commentId`  
**Auth Required**: Yes (own comment, moderator, or admin)

**Success Response (204):** No content

---

### 28. Like Comment

**Endpoint**: `POST /comments/:commentId/like`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likesCount": 6
  }
}
```

---

### 29. Unlike Comment

**Endpoint**: `DELETE /comments/:commentId/like`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isLiked": false,
    "likesCount": 5
  }
}
```

---

## Community Endpoints

### 30. Get All Communities

**Endpoint**: `GET /communities`  
**Auth Required**: Optional  
**Query Params**: `page`, `limit`, `search`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "communityId123",
      "name": "JavaScript Developers",
      "description": "Community for JS enthusiasts",
      "coverImage": "https://...",
      "membersCount": 1250,
      "postsCount": 3420,
      "isMember": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

---

### 31. Get Community by ID

**Endpoint**: `GET /communities/:communityId`  
**Auth Required**: Optional

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "community": {
      "id": "communityId123",
      "name": "JavaScript Developers",
      "description": "Community for JS enthusiasts",
      "coverImage": "https://...",
      "rules": "1. Be respectful\n2. No spam",
      "tags": ["javascript", "webdev"],
      "membersCount": 1250,
      "postsCount": 3420,
      "isMember": true,
      "moderators": [
        {
          "id": "userId456",
          "username": "moderator1",
          "profilePicture": "https://..."
        }
      ],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  }
}
```

---

### 32. Join Community

**Endpoint**: `POST /communities/:communityId/join`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isMember": true,
    "membersCount": 1251
  },
  "message": "Joined community successfully"
}
```

---

### 33. Leave Community

**Endpoint**: `DELETE /communities/:communityId/join`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isMember": false,
    "membersCount": 1250
  },
  "message": "Left community successfully"
}
```

---

### 34. Get Community Posts

**Endpoint**: `GET /communities/:communityId/posts`  
**Auth Required**: Optional  
**Query Params**: `page`, `limit`, `sortBy`

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of post objects */ ],
  "pagination": { /* pagination object */ }
}
```

---

### 35. Get Community Members

**Endpoint**: `GET /communities/:communityId/members`  
**Auth Required**: Yes  
**Query Params**: `page`, `limit`

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of user objects */ ],
  "pagination": { /* pagination object */ }
}
```

---

## Feed Endpoints

### 36. Get Home Feed

**Endpoint**: `GET /feed/home`  
**Auth Required**: Yes  
**Query Params**: `page`, `limit`

**Description**: Algorithmic feed with posts from followed users and joined communities

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of post objects with repost info */ ],
  "pagination": { /* pagination object */ }
}
```

---

### 37. Get Following Feed

**Endpoint**: `GET /feed/following`  
**Auth Required**: Yes  
**Query Params**: `page`, `limit`

**Description**: Chronological feed with posts from followed users only

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of post objects */ ],
  "pagination": { /* pagination object */ }
}
```

---

## Messaging Endpoints

### 38. Get Conversations

**Endpoint**: `GET /messages/conversations`  
**Auth Required**: Yes  
**Query Params**: `page`, `limit`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "conversationId123",
      "type": "individual",
      "participants": [
        {
          "id": "userId456",
          "username": "janedoe",
          "profilePicture": "https://...",
          "isOnline": true,
          "lastSeen": "2025-12-12T12:00:00Z"
        }
      ],
      "lastMessage": {
        "id": "messageId789",
        "content": "Hey, how are you?",
        "sender": { /* user object */ },
        "createdAt": "2025-12-12T11:45:00Z"
      },
      "unreadCount": 3,
      "updatedAt": "2025-12-12T11:45:00Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

---

### 39. Get Conversation by ID

**Endpoint**: `GET /messages/conversations/:conversationId`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conversationId123",
      "type": "group",
      "name": "Dev Team Chat",
      "image": "https://...",
      "participants": [ /* array of user objects */ ],
      "admin": { /* user object (for groups) */ },
      "createdAt": "2025-12-01T10:00:00Z"
    }
  }
}
```

---

### 40. Get Messages

**Endpoint**: `GET /messages/conversations/:conversationId/messages`  
**Auth Required**: Yes  
**Query Params**: `page`, `limit`, `before` (timestamp for loading older)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "messageId789",
      "sender": {
        "id": "userId123",
        "username": "johndoe",
        "profilePicture": "https://..."
      },
      "content": "Hello everyone!",
      "image": "https://...",
      "status": "seen",
      "seenBy": [
        {
          "userId": "userId456",
          "seenAt": "2025-12-12T11:50:00Z"
        }
      ],
      "createdAt": "2025-12-12T11:45:00Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

---

### 41. Send Message

**Endpoint**: `POST /messages/conversations/:conversationId/messages`  
**Auth Required**: Yes

**Request Body:**
```json
{
  "content": "Hello everyone!",
  "image": "https://..."
}
```

**Validation Rules:**
- `content`: Max 2000 chars (required if no image)
- `image`: Valid image URL (optional)

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "message": { /* message object */ }
  }
}
```

---

### 42. Create Individual Conversation

**Endpoint**: `POST /messages/conversations`  
**Auth Required**: Yes

**Request Body:**
```json
{
  "participantId": "userId456"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "conversation": { /* conversation object */ }
  }
}
```

*Note: Returns existing conversation if already exists*

---

### 43. Create Group Conversation

**Endpoint**: `POST /messages/conversations/group`  
**Auth Required**: Yes

**Request Body:**
```json
{
  "name": "Dev Team Chat",
  "participantIds": ["userId456", "userId789"],
  "image": "https://..."
}
```

**Validation Rules:**
- `name`: Required, 2-100 chars
- `participantIds`: Array, min 2, max 99 (+ creator = 100)
- `image`: Optional, valid URL

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "conversation": { /* group conversation object */ }
  }
}
```

---

### 44. Add Group Member

**Endpoint**: `POST /messages/conversations/:conversationId/members`  
**Auth Required**: Yes (group admin only)

**Request Body:**
```json
{
  "userId": "userId999"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member added successfully"
}
```

**Error Responses:**
- `403`: Not group admin
- `400`: Group is full (100 members)

---

### 45. Remove Group Member

**Endpoint**: `DELETE /messages/conversations/:conversationId/members/:userId`  
**Auth Required**: Yes (group admin only)

**Success Response (204):** No content

---

### 46. Leave Group

**Endpoint**: `POST /messages/conversations/:conversationId/leave`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Left group successfully"
}
```

---

### 47. Update Group Info

**Endpoint**: `PATCH /messages/conversations/:conversationId`  
**Auth Required**: Yes (group admin only)

**Request Body:**
```json
{
  "name": "Updated Group Name",
  "image": "https://..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "conversation": { /* updated conversation object */ }
  }
}
```

---

### 48. Mark Messages as Seen

**Endpoint**: `POST /messages/conversations/:conversationId/seen`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Messages marked as seen"
}
```

---

## Notification Endpoints

### 49. Get Notifications

**Endpoint**: `GET /notifications`  
**Auth Required**: Yes  
**Query Params**: `page`, `limit`, `unreadOnly` (boolean)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notificationId123",
      "type": "like",
      "actor": {
        "id": "userId456",
        "username": "janedoe",
        "profilePicture": "https://..."
      },
      "post": {
        "id": "postId123",
        "content": "My awesome post..."
      },
      "isRead": false,
      "createdAt": "2025-12-12T11:00:00Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

**Notification Types:**
- `like`: Someone liked your post
- `comment`: Someone commented on your post
- `reply`: Someone replied to your comment
- `repost`: Someone reposted your post
- `follow`: Someone followed you

---

### 50. Get Unread Count

**Endpoint**: `GET /notifications/unread-count`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 12
  }
}
```

---

### 51. Mark Notification as Read

**Endpoint**: `PATCH /notifications/:notificationId/read`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 52. Mark All as Read

**Endpoint**: `POST /notifications/read-all`  
**Auth Required**: Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## Search Endpoints

### 53. Search Users

**Endpoint**: `GET /search/users`  
**Auth Required**: Optional  
**Query Params**: `q` (query), `specialization`, `page`, `limit`

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of user objects */ ],
  "pagination": { /* pagination object */ }
}
```

---

### 54. Search Posts

**Endpoint**: `GET /search/posts`  
**Auth Required**: Optional  
**Query Params**: `q` (query), `tags`, `type`, `communityId`, `page`, `limit`

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of post objects */ ],
  "pagination": { /* pagination object */ }
}
```

---

### 55. Search Communities

**Endpoint**: `GET /search/communities`  
**Auth Required**: Optional  
**Query Params**: `q` (query), `page`, `limit`

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of community objects */ ],
  "pagination": { /* pagination object */ }
}
```

---

## Report Endpoints

### 56. Report Post

**Endpoint**: `POST /reports/posts/:postId`  
**Auth Required**: Yes

**Request Body:**
```json
{
  "reason": "spam",
  "description": "This post contains spam content"
}
```

**Validation Rules:**
- `reason`: Enum: "spam", "harassment", "inappropriate", "misinformation", "other"
- `description`: Optional, max 500 chars

**Success Response (201):**
```json
{
  "success": true,
  "message": "Report submitted successfully"
}
```

---

### 57. Report Comment

**Endpoint**: `POST /reports/comments/:commentId`  
**Auth Required**: Yes

**Request Body:** Same as post report

**Success Response (201):** Same as post report

---

### 58. Report User

**Endpoint**: `POST /reports/users/:userId`  
**Auth Required**: Yes

**Request Body:** Same as post report

**Success Response (201):** Same as post report

---

## Admin Endpoints

### 59. Get All Reports

**Endpoint**: `GET /admin/reports`  
**Auth Required**: Yes (Admin only)  
**Query Params**: `status`, `type`, `page`, `limit`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "reportId123",
      "type": "post",
      "reason": "spam",
      "description": "This post contains spam",
      "reporter": { /* user object */ },
      "reportedContent": { /* post/comment/user object */ },
      "status": "pending",
      "createdAt": "2025-12-12T10:00:00Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

**Status Values:** "pending", "reviewed", "resolved", "dismissed"

---

### 60. Resolve Report

**Endpoint**: `PATCH /admin/reports/:reportId`  
**Auth Required**: Yes (Admin only)

**Request Body:**
```json
{
  "action": "delete_content",
  "status": "resolved",
  "note": "Content removed for violating guidelines"
}
```

**Action Values:** "dismiss", "delete_content", "warn_user", "block_user"

**Success Response (200):**
```json
{
  "success": true,
  "message": "Report resolved successfully"
}
```

---

### 61. Get All Users (Admin)

**Endpoint**: `GET /admin/users`  
**Auth Required**: Yes (Admin only)  
**Query Params**: `search`, `status`, `page`, `limit`

**Success Response (200):**
```json
{
  "success": true,
  "data": [ /* array of user objects with admin fields */ ],
  "pagination": { /* pagination object */ }
}
```

---

### 62. Block User (Admin)

**Endpoint**: `POST /admin/users/:userId/block`  
**Auth Required**: Yes (Admin only)

**Request Body:**
```json
{
  "reason": "Repeated violations of community guidelines"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

---

### 63. Unblock User (Admin)

**Endpoint**: `DELETE /admin/users/:userId/block`  
**Auth Required**: Yes (Admin only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

### 64. Delete User (Admin)

**Endpoint**: `DELETE /admin/users/:userId`  
**Auth Required**: Yes (Admin only)

**Success Response (204):** No content

*Note: Cascades to all user content*

---

### 65. Create Community (Admin)

**Endpoint**: `POST /admin/communities`  
**Auth Required**: Yes (Admin only)

**Request Body:**
```json
{
  "name": "New Community",
  "description": "Community description",
  "coverImage": "https://...",
  "rules": "1. Be respectful\n2. No spam",
  "tags": ["tag1", "tag2"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "community": { /* community object */ }
  }
}
```

---

### 66. Update Community (Admin)

**Endpoint**: `PATCH /admin/communities/:communityId`  
**Auth Required**: Yes (Admin only)

**Request Body:** Same fields as create (all optional)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "community": { /* updated community object */ }
  }
}
```

---

### 67. Delete Community (Admin)

**Endpoint**: `DELETE /admin/communities/:communityId`  
**Auth Required**: Yes (Admin only)

**Success Response (204):** No content

---

### 68. Assign Moderator

**Endpoint**: `POST /admin/communities/:communityId/moderators`  
**Auth Required**: Yes (Admin only)

**Request Body:**
```json
{
  "userId": "userId456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Moderator assigned successfully"
}
```

---

### 69. Remove Moderator

**Endpoint**: `DELETE /admin/communities/:communityId/moderators/:userId`  
**Auth Required**: Yes (Admin only)

**Success Response (204):** No content

---

### 70. Get Platform Statistics

**Endpoint**: `GET /admin/statistics`  
**Auth Required**: Yes (Admin only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 5420,
    "activeUsers": 1234,
    "totalPosts": 12500,
    "totalComments": 45000,
    "totalCommunities": 25,
    "totalReports": 45,
    "pendingReports": 12
  }
}
```

---

## File Upload Endpoint

### 71. Upload Image

**Endpoint**: `POST /upload/image`  
**Auth Required**: Yes  
**Content-Type**: `multipart/form-data`

**Request Body:**
```
file: <image file>
type: "profile" | "cover" | "post" | "message" | "community"
```

**Validation Rules:**
- File types: JPEG, PNG, WebP only
- Max size: 5MB (2MB for profile pictures)
- Automatic resize and compression

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/images/abc123.jpg",
    "thumbnail": "https://storage.example.com/images/abc123_thumb.jpg"
  }
}
```

**Error Responses:**
- `400`: Invalid file type or size
- `413`: File too large

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

- **Authentication**: 5 login attempts per 15 minutes per IP
- **Post Creation**: 10 posts per hour per user
- **Comment Creation**: 30 comments per hour per user
- **Message Sending**: 100 messages per hour per user
- **Report Submission**: 10 reports per hour per user
- **General API**: 100 requests per minute per user

**Rate Limit Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 300
    }
  }
}
```

---

## WebSocket Events

**Technology**: Socket.io  
**Connection URL**: `ws://localhost:3000` (dev) or `wss://api.itihub.com` (production)  
**Authentication**: Include JWT token in connection handshake

### Connection Setup

**Client Connection:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'JWT_TOKEN_HERE'
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

### MVP Events (Required)

#### 1. `message:new`
**Direction**: Server → Client  
**Trigger**: New message sent in a conversation user is part of  
**Payload**:
```json
{
  "conversationId": "conv123",
  "message": {
    "id": "msg456",
    "sender": {
      "id": "user789",
      "username": "johndoe",
      "profilePicture": "https://..."
    },
    "content": "Hello!",
    "createdAt": "2025-12-12T10:00:00Z"
  }
}
```

#### 2. `notification:new`
**Direction**: Server → Client  
**Trigger**: New notification for user (like, comment, follow, etc.)  
**Payload**:
```json
{
  "id": "notif123",
  "type": "like",
  "actor": {
    "id": "user789",
    "username": "johndoe",
    "profilePicture": "https://..."
  },
  "post": {
    "id": "post456",
    "content": "My post content..."
  },
  "createdAt": "2025-12-12T10:00:00Z"
}
```

#### 3. `user:status`
**Direction**: Server → Client  
**Trigger**: User comes online or goes offline  
**Payload**:
```json
{
  "userId": "user789",
  "status": "online",
  "lastSeen": "2025-12-12T10:00:00Z"
}
```

#### 4. `message:seen`
**Direction**: Client → Server  
**Purpose**: Mark messages in conversation as seen  
**Payload**:
```json
{
  "conversationId": "conv123"
}
```

### Future Enhancement (Post-MVP)

- `typing:start`: User started typing (not implemented in MVP)
- `typing:stop`: User stopped typing (not implemented in MVP)
- `post:new`: New post from followed user (real-time feed updates)

---

## Documentation Structure Recommendation

**Note**: This specification file should be separated into multiple organized files for easier maintenance and planning:

**Suggested Structure:**
- `API-Overview.md` - General information, authentication, response formats
- `API-Auth.md` - Authentication endpoints
- `API-Users.md` - User management endpoints
- `API-Posts.md` - Post creation and interaction endpoints
- `API-Comments.md` - Comment endpoints
- `API-Communities.md` - Community endpoints
- `API-Feed.md` - Feed algorithms and endpoints
- `API-Messaging.md` - Messaging and conversation endpoints
- `API-Notifications.md` - Notification endpoints
- `API-Search.md` - Search endpoints
- `API-Reports.md` - Report endpoints
- `API-Admin.md` - Admin and moderation endpoints
- `API-WebSocket.md` - Real-time WebSocket events

---

**End of API Specification**
