# ITI-HUB API Documentation

> **Version:** 1.0.0  
> **Base URL:** `http://localhost:3030`  
> **Last Updated:** December 16, 2025

## Table of Contents

- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Auth](#auth)
  - [Users](#users)
  - [Connections](#connections)
  - [Posts](#posts)
  - [Comments](#comments)
  - [Feed](#feed)
  - [Communities](#communities)
  - [Conversations & Messages](#conversations--messages)
  - [Notifications](#notifications)
- [Response Formats](#response-formats)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [File Upload](#file-upload)
- [WebSocket Events](#websocket-events)
  - [Client → Server Events](#client--server-events)
  - [Server → Client Events](#server--client-events)

---

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained from the `/auth/register` or `/auth/login` endpoints and are valid for 7 days.

---

## API Endpoints

### Auth

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/password-reset/request` | Request password reset email | No |
| POST | `/auth/password-reset/confirm` | Confirm password reset with token | No |

#### POST /auth/register

Register a new user account.

**Rate Limit:** 5 requests per hour per IP

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
- Email: Valid email format
- Password: Min 8 chars, must contain uppercase, lowercase, and number
- Username: 3-30 characters, alphanumeric and underscores only
- Full Name: Min 2 characters

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "6510d1a2b3c4d5e6f7890123",
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login

Authenticate user and receive token.

**Rate Limit:** 10 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/password-reset/request

Request password reset email.

**Rate Limit:** 3 requests per hour per IP

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/password-reset/confirm

Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123"
}
```

---

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/{username}` | Get user profile by username | Optional |
| PUT | `/users/profile` | Update own profile | Yes |
| POST | `/users/profile/picture` | Upload profile picture | Yes |
| POST | `/users/profile/cover` | Upload cover image | Yes |
| POST | `/users/{userId}/block` | Block a user | Yes |
| DELETE | `/users/{userId}/block` | Unblock a user | Yes |
| GET | `/users/{userId}/posts` | Get user's posts | Optional |

#### GET /users/{username}

Get user profile by username. Returns relationship info when authenticated.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "fullName": "John Doe",
    "bio": "Full-stack developer",
    "profilePicture": "https://...",
    "coverImage": "https://...",
    "followersCount": 150,
    "followingCount": 75,
    "postsCount": 42,
    "isFollowing": false,
    "followsYou": false
  }
}
```

#### PUT /users/profile

Update authenticated user's profile.

**Request Body:**
```json
{
  "fullName": "John Smith",
  "bio": "Updated bio",
  "specialization": "React Developer",
  "location": "San Francisco, CA"
}
```

#### POST /users/profile/picture

Upload profile picture (multipart/form-data).

**Request:** `multipart/form-data` with `image` field

**Response (200):**
```json
{
  "message": "Profile picture updated successfully",
  "profilePicture": "https://res.cloudinary.com/..."
}
```

---

### Connections

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/users/{userId}/follow` | Follow a user | Yes |
| DELETE | `/users/{userId}/follow` | Unfollow a user | Yes |
| GET | `/users/{userId}/followers` | Get user's followers | Optional |
| GET | `/users/{userId}/following` | Get users that user follows | Optional |

#### POST /users/{userId}/follow

Follow a user.

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully followed user",
  "data": {
    "followedUserId": "507f1f77bcf86cd799439012",
    "followedAt": "2025-12-16T10:00:00.000Z"
  }
}
```

#### GET /users/{userId}/followers

Get paginated list of followers.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "_id": "...",
        "username": "...",
        "fullName": "...",
        "profilePicture": "...",
        "isFollowing": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### Posts

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/posts` | Create a new post | Yes |
| GET | `/posts/saved` | Get saved posts | Yes |
| GET | `/posts/{id}` | Get a single post | Optional |
| PATCH | `/posts/{id}` | Update a post | Yes |
| DELETE | `/posts/{id}` | Delete a post | Yes |
| POST | `/posts/{id}/like` | Like a post | Yes |
| DELETE | `/posts/{id}/like` | Unlike a post | Yes |
| POST | `/posts/{id}/save` | Save a post | Yes |
| DELETE | `/posts/{id}/save` | Unsave a post | Yes |
| POST | `/posts/{id}/repost` | Repost a post | Yes |
| POST | `/posts/{postId}/comments` | Create a comment | Yes |
| GET | `/posts/{postId}/comments` | Get post comments | Optional |

#### POST /posts

Create a new post with optional images.

**Request (multipart/form-data):**
- `content` - Post text (max 500 chars)
- `images[]` - Up to 4 image files (JPEG, PNG, WebP)
- `tags[]` - Up to 5 tags
- `community` - Community ID (optional)

**Response (201):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post": {
      "_id": "...",
      "content": "Just shipped a new feature! 🚀",
      "author": {
        "_id": "...",
        "username": "johndoe",
        "fullName": "John Doe",
        "profilePicture": "..."
      },
      "images": ["https://..."],
      "tags": ["coding"],
      "likesCount": 0,
      "commentsCount": 0,
      "repostsCount": 0,
      "createdAt": "2025-12-16T10:00:00.000Z"
    }
  }
}
```

#### GET /posts/{id}

Get a single post. Returns `isLiked` and `isSaved` for authenticated users.

---

### Comments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| PUT | `/comments/{id}` | Update a comment | Yes |
| DELETE | `/comments/{id}` | Delete a comment | Yes |
| POST | `/comments/{id}/like` | Like a comment | Yes |
| DELETE | `/comments/{id}/like` | Unlike a comment | Yes |

---

### Feed

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/feed/home` | Get home feed | Optional |
| GET | `/feed/following` | Get following feed | Yes |
| GET | `/feed/trending` | Get trending feed | Optional |

#### GET /feed/home

Get home feed with algorithmic ranking for authenticated users.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 50)

**Response (200):**
```json
{
  "success": true,
  "feedType": "home",
  "posts": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  },
  "cached": false
}
```

**Behavior:**
- **Authenticated:** Algorithmic feed from connections and communities
- **Unauthenticated:** Featured tags feed (chronological)

#### GET /feed/following

Get chronological feed from followed users and communities.

**Requires authentication.**

#### GET /feed/trending

Get global trending feed ranked by engagement.

---

### Communities

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/communities` | List all communities | Optional |
| POST | `/communities` | Create a community | Yes |
| GET | `/communities/{id}` | Get community details | Optional |
| PATCH | `/communities/{id}` | Update community | Yes (Owner) |
| POST | `/communities/{id}/profile-picture` | Update profile picture | Yes (Owner) |
| POST | `/communities/{id}/cover-image` | Update cover image | Yes (Owner) |
| POST | `/communities/{id}/join` | Join a community | Yes |
| POST | `/communities/{id}/leave` | Leave a community | Yes |
| POST | `/communities/{id}/moderators` | Add moderator | Yes (Owner/Mod) |
| DELETE | `/communities/{id}/moderators/{userId}` | Remove moderator | Yes (Owner/Mod) |
| GET | `/communities/{communityId}/feed` | Get community feed | Optional |

---

### Conversations & Messages

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/conversations` | Get user's conversations | Yes |
| POST | `/conversations` | Create individual conversation | Yes |
| POST | `/conversations/group` | Create group conversation | Yes |
| GET | `/conversations/{conversationId}` | Get conversation details | Yes |
| PATCH | `/conversations/{conversationId}` | Update group details | Yes (Admin) |
| POST | `/conversations/{conversationId}/members` | Add group member | Yes (Admin) |
| DELETE | `/conversations/{conversationId}/members/{userId}` | Remove group member | Yes (Admin) |
| POST | `/conversations/{conversationId}/leave` | Leave group | Yes |
| GET | `/conversations/{conversationId}/messages` | Get messages | Yes |
| POST | `/conversations/{conversationId}/messages` | Send message | Yes |
| PUT | `/conversations/{conversationId}/seen` | Mark as seen | Yes |

---

### Notifications

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | Get notifications | Yes |
| PUT | `/notifications/{id}/read` | Mark notification as read | Yes |
| PUT | `/notifications/read-all` | Mark all as read | Yes |

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

### Auth Error Format (with error codes)

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /auth/register | 5 requests/hour |
| POST /auth/login | 10 requests/15 minutes |
| POST /auth/password-reset/* | 3 requests/hour |

When rate limited, you'll receive a 429 response:

```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests. Please try again later."
  }
}
```

---

## Caching

Feed endpoints implement caching:

| Endpoint | Cache TTL |
|----------|-----------|
| /feed/home | 5 minutes |
| /feed/following | 1 minute |
| /feed/trending | 5 minutes |

Cached responses include `"cached": true` in the response body.

---

## File Upload Guidelines

### Supported Formats
- JPEG, PNG, WebP

### Size Limits
- Profile Picture: 5MB (processed to 500x500px)
- Cover Image: 10MB (processed to 1500x500px)
- Post Images: 10MB each, max 4 images (processed to max 2000x2000px)
- Message Images: 10MB

All images are automatically:
- Resized to appropriate dimensions
- Compressed for optimization
- Converted to WebP format
- Uploaded to Cloudinary

---

## WebSocket Events

The API uses Socket.io for real-time messaging functionality. Connect to the WebSocket server at the same host (`ws://localhost:3030`).

### Connection

**Connecting with Authentication:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3030', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

**Authentication Errors:**
- `Authentication error: No token provided`
- `Authentication error: Invalid token`
- `Authentication error: Token expired`
- `Authentication error: User not found`

---

### Client → Server Events

#### `message:send`
Send a new message in real-time.

**Payload:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "content": "Hello!",
  "image": "https://cloudinary.com/...",
  "senderId": "507f1f77bcf86cd799439012",
  "senderName": "John Doe",
  "messageId": "507f1f77bcf86cd799439013"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| conversationId | string | Yes | The conversation ID |
| content | string | No | Message text content |
| image | string | No | Image URL (from upload) |
| senderId | string | Yes | ID of the sender |
| senderName | string | No | Display name of sender |
| messageId | string | No | ID of the created message |

---

#### `message:seen`
Mark messages as seen.

**Payload:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| conversationId | string | Yes | The conversation ID |
| userId | string | Yes | ID of user who saw messages |

---

#### `typing:start`
Indicate user started typing.

**Payload:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012"
}
```

> **Note:** Throttled to 1 event per second per user. Auto-triggers `typing:stop` after 3 seconds.

---

#### `typing:stop`
Indicate user stopped typing.

**Payload:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012"
}
```

---

### Server → Client Events

#### `message:new`
Receive a new message in real-time.

**Payload:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "content": "Hello!",
  "image": "https://cloudinary.com/...",
  "senderId": "507f1f77bcf86cd799439012",
  "senderName": "John Doe",
  "messageId": "507f1f77bcf86cd799439013",
  "timestamp": "2025-12-15T10:30:00.000Z"
}
```

---

#### `message:seen`
Notification that someone saw messages.

**Payload:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "timestamp": "2025-12-15T10:30:00.000Z"
}
```

---

#### `typing:start`
Notification that someone started typing.

**Payload:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012"
}
```

---

#### `typing:stop`
Notification that someone stopped typing.

**Payload:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012"
}
```

---

#### `user:online` *(Pending - Requires Connection Model)*
Notification when a contact comes online.

**Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "status": "online"
}
```

---

#### `user:offline` *(Pending - Requires Connection Model)*
Notification when a contact goes offline.

**Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "status": "offline",
  "lastSeen": "2025-12-15T10:30:00.000Z"
}
```

---

### WebSocket Performance Notes

| Feature | Detail |
|---------|--------|
| Throttling | `typing:start` events throttled to 1 per second per user |
| Auto-stop | `typing:start` auto-triggers `typing:stop` after 3 seconds |
| Multi-device | Users can connect from multiple devices simultaneously |
| Offline handling | Events to offline users are skipped (no queuing) |

---

### WebSocket Client Example (React)

```javascript
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

function Chat({ conversationId, token }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());

  useEffect(() => {
    const newSocket = io('http://localhost:3030', {
      auth: { token }
    });

    newSocket.on('message:new', (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data]);
      }
    });

    newSocket.on('typing:start', (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      }
    });

    newSocket.on('typing:stop', (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, [conversationId, token]);

  const sendMessage = (content) => {
    socket.emit('message:send', {
      conversationId,
      content,
      senderId: currentUserId,
      senderName: currentUserName
    });
  };

  return (
    <div>
      {typingUsers.size > 0 && <div>Someone is typing...</div>}
      {/* Chat UI */}
    </div>
  );
}
```
