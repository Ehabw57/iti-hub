# Epic 9: Search (P1)

**Priority**: P1 (Post-MVP Enhancement)  
**Estimated Effort**: 6-8 days  
**Dependencies**: Epic 1 (Authentication), Epic 2 (User Profiles), Epic 3 (Posts), Epic 6 (Communities)  
**Specifications**: `/docs/specs/API-Specification.md` (lines 1585-1634)

---

## User Stories

### US1: Search for Users
**As a** user  
**I want to** search for other users by name or username  
**So that** I can find and connect with people on the platform

**Acceptance Criteria:**
- Search users by username or full name (case-insensitive)
- Results sorted alphabetically by username
- Filter by specialization (optional)
- Pagination support (default: 20 per page, max: defined in constants)
- Blocked users excluded from results (when authenticated)
- Returns public user profile information
- Works for both authenticated and non-authenticated users
- Optional authentication shows relationship status (isFollowing)

---

### US2: Search for Posts
**As a** user  
**I want to** search for posts by content or tags  
**So that** I can discover relevant content

**Acceptance Criteria:**
- Search posts by content text (case-insensitive)
- Filter by tags (optional, multiple tags supported)
- Filter by post type: "original" or "repost" (optional)
- Filter by communityId (optional)
- Results sorted alphabetically by content (simple sort)
- Pagination support
- Only returns non-deleted posts
- Works for both authenticated and non-authenticated users
- Shows full post details with author information

---

### US3: Search for Communities
**As a** user  
**I want to** search for communities by name or description  
**So that** I can find and join relevant communities

**Acceptance Criteria:**
- Search communities by name or description (case-insensitive)
- Filter by tags (optional, multiple tags supported)
- Results sorted by member count (descending)
- Pagination support
- Shows community details (name, description, member count, cover image)
- Works for both authenticated and non-authenticated users
- When authenticated, shows if user is a member (isMember field)

---

## Phase 1: Setup (Foundation)

### T101: Update Constants for Search Configuration
**Type**: Configuration  
**User Story**: Foundation  
**Estimated Effort**: 0.25 days  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/utils/constants.js`

**Constants to Add:**
```javascript
// Search Configuration
MAX_SEARCH_RESULTS: 50,          // Maximum results per page for search
DEFAULT_SEARCH_LIMIT: 20,        // Default number of results per page
MIN_SEARCH_QUERY_LENGTH: 2,      // Minimum characters required for search
```

**Note:** Add these constants to the existing `/server/utils/constants.js` file in the appropriate section (after pagination defaults, before community constants).

**Test Cases:**
File: `/server/spec/utils/constants.spec.js`
- ✓ Should export MAX_SEARCH_RESULTS constant
- ✓ Should export DEFAULT_SEARCH_LIMIT constant
- ✓ Should export MIN_SEARCH_QUERY_LENGTH constant
- ✓ MAX_SEARCH_RESULTS should be greater than DEFAULT_SEARCH_LIMIT
- ✓ MIN_SEARCH_QUERY_LENGTH should be at least 2

**Dependencies:** None  
**Blocking:** T102, T103, T104, T105

---

### T102: Create Text Indexes on Models
**Type**: Database Migration / Model Update  
**User Story**: Foundation  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: No  
**Priority**: Blocking

**Target Files:**
- `/server/models/User.js` - Add text index
- `/server/models/Post.js` - Add text index
- `/server/models/Community.js` - Add text index

**Indexes to Create:**

**User Model:**
```javascript
// Text index for search
userSchema.index({ 
  username: 'text', 
  fullName: 'text', 
  bio: 'text' 
}, { 
  weights: { 
    username: 10,    // Highest priority
    fullName: 5,     // Medium priority
    bio: 1           // Lowest priority
  },
  name: 'user_search_index'
});
```

**Post Model:**
```javascript
// Text index for search
postSchema.index({ 
  content: 'text',
  tags: 'text'
}, {
  weights: {
    tags: 5,         // Tags more important
    content: 1       // Content lower priority
  },
  name: 'post_search_index'
});
```

**Community Model:**
```javascript
// Text index for search
communitySchema.index({ 
  name: 'text', 
  description: 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,        // Name highest priority
    tags: 5,         // Tags medium priority
    description: 1   // Description lowest priority
  },
  name: 'community_search_index'
});
```

**Test Cases:**
File: `/server/spec/models/searchIndexes.spec.js`
- ✓ User model should have text index on username, fullName, bio
- ✓ Post model should have text index on content, tags
- ✓ Community model should have text index on name, description, tags
- ✓ Text search should be case-insensitive
- ✓ Text search should support partial word matching
- ✓ Text search should respect weight priorities

**Dependencies:** T101  
**Blocking:** T103, T104, T105

---

### T103: Create Search Helper Utilities
**Type**: Utility  
**User Story**: Foundation  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: Yes (after T101)  
**Priority**: Normal

**Target File:**
- `/server/utils/searchHelpers.js`

**Functions to Implement:**

1. **`validateSearchQuery(query)`**
   - Validate minimum query length
   - Sanitize query string
   - Return sanitized query or throw validation error

2. **`buildSearchFilter(query, additionalFilters = {})`**
   - Build MongoDB text search filter
   - Combine with additional filters (tags, type, communityId, etc.)
   - Return filter object

3. **`sanitizeSearchQuery(query)`**
   - Remove special regex characters
   - Trim whitespace
   - Convert to lowercase for consistency

4. **`parseSearchPagination(page, limit)`**
   - Validate and parse pagination parameters
   - Enforce MAX_SEARCH_RESULTS limit
   - Return { page, limit, skip }

**Test Cases:**
File: `/server/spec/utils/searchHelpers.spec.js`
- ✓ validateSearchQuery: Should validate minimum query length
- ✓ validateSearchQuery: Should throw error for empty query
- ✓ validateSearchQuery: Should throw error for query too short
- ✓ validateSearchQuery: Should accept valid query
- ✓ sanitizeSearchQuery: Should remove special characters
- ✓ sanitizeSearchQuery: Should trim whitespace
- ✓ sanitizeSearchQuery: Should handle null/undefined
- ✓ buildSearchFilter: Should build text search filter
- ✓ buildSearchFilter: Should combine with additional filters
- ✓ buildSearchFilter: Should handle empty additional filters
- ✓ parseSearchPagination: Should parse valid pagination
- ✓ parseSearchPagination: Should enforce max limit
- ✓ parseSearchPagination: Should default to page 1
- ✓ parseSearchPagination: Should calculate skip correctly

**Dependencies:** T101  
**Blocking:** T104, T105, T106

---

## Phase 2: User Story 1 - Search for Users

### T104: Implement Search Users Controller
**Type**: Controller  
**User Story**: US1 - Search for Users  
**Estimated Effort**: 1.5 days  
**Can Run in Parallel**: No  
**Priority**: Normal

**Target File:**
- `/server/controllers/user/searchUsersController.js`

**Function to Implement:**
```javascript
async function searchUsers(req, res) {
  // Extract query parameters
  // Validate query string (minimum length)
  // Parse pagination (page, limit)
  // Build search filter (text search + specialization filter)
  // If authenticated: get current user ID for blocking filter
  // Query users with filters, excluding blocked users
  // Sort alphabetically by username (case-insensitive)
  // For authenticated requests: add isFollowing field
  // Return paginated results
}
```

**Query Parameters:**
- `q` (string, required): Search query (min 2 chars)
- `specialization` (string, optional): Filter by specialization
- `page` (integer, optional, default: 1)
- `limit` (integer, optional, default: 20, max: MAX_SEARCH_RESULTS)

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "userId123",
      "username": "johndoe",
      "fullName": "John Doe",
      "profilePicture": "https://...",
      "bio": "Software developer",
      "specialization": "Web Development",
      "followersCount": 150,
      "followingCount": 200,
      "isFollowing": false // Only when authenticated
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**Business Logic:**
1. Validate query length (min 2 characters)
2. Sanitize query string
3. Build text search filter using `$text` and `$search`
4. Add specialization filter if provided
5. If authenticated:
   - Get blocked user IDs (users who blocked current user + users current user blocked)
   - Exclude blocked users from results
6. Query users with select fields (exclude sensitive data: email, password, etc.)
7. Sort results alphabetically by username (collation for case-insensitive)
8. Apply pagination
9. If authenticated: Check isFollowing status for each result
10. Return results with pagination metadata

**Edge Cases:**
- Query too short: Return 400 error
- No results found: Return empty array with pagination
- Invalid specialization: Ignore filter
- Blocked users: Excluded from results
- Non-authenticated: No isFollowing field, no blocking filter

**Test Cases:**
File: `/server/spec/controllers/user/searchUsersController.spec.js`
- ✓ Should search users by username (case-insensitive)
- ✓ Should search users by full name (case-insensitive)
- ✓ Should search users by bio content
- ✓ Should return 400 if query is too short
- ✓ Should return 400 if query is missing
- ✓ Should filter by specialization
- ✓ Should return empty array if no results
- ✓ Should sort results alphabetically by username
- ✓ Should exclude blocked users (authenticated)
- ✓ Should exclude users who blocked current user (authenticated)
- ✓ Should include isFollowing field (authenticated)
- ✓ Should not include isFollowing field (non-authenticated)
- ✓ Should paginate results correctly
- ✓ Should enforce max results limit
- ✓ Should handle invalid pagination parameters
- ✓ Should not expose sensitive user data (email, password)

**Dependencies:** Epic 1, Epic 2, T101, T102, T103  
**Blocking:** T107, T108

---

## Phase 3: User Story 2 - Search for Posts

### T105: Implement Search Posts Controller
**Type**: Controller  
**User Story**: US2 - Search for Posts  
**Estimated Effort**: 1.5 days  
**Can Run in Parallel**: No  
**Priority**: Normal

**Target File:**
- `/server/controllers/post/searchPostsController.js`

**Function to Implement:**
```javascript
async function searchPosts(req, res) {
  // Extract query parameters
  // Validate query string (minimum length)
  // Parse pagination
  // Build search filter (text search + tags filter + type filter + communityId filter)
  // If authenticated: get current user ID for likes/saves status
  // Query posts with filters (exclude deleted posts)
  // Sort alphabetically by content
  // Populate author and community details
  // For authenticated requests: add hasLiked, hasSaved fields
  // Return paginated results
}
```

**Query Parameters:**
- `q` (string, required): Search query (min 2 chars)
- `tags` (string, optional): Comma-separated tags to filter by
- `type` (string, optional): "original" or "repost"
- `communityId` (string, optional): Filter by community ID
- `page` (integer, optional, default: 1)
- `limit` (integer, optional, default: 20, max: MAX_SEARCH_RESULTS)

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "postId123",
      "content": "This is a post about web development",
      "images": ["https://..."],
      "tags": ["webdev", "javascript"],
      "type": "original",
      "author": {
        "id": "userId123",
        "username": "johndoe",
        "fullName": "John Doe",
        "profilePicture": "https://..."
      },
      "community": {
        "id": "communityId",
        "name": "Web Dev"
      },
      "likesCount": 45,
      "commentsCount": 12,
      "repostsCount": 3,
      "savesCount": 8,
      "hasLiked": false,
      "hasSaved": false,
      "createdAt": "2025-12-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 78,
    "pages": 4
  }
}
```

**Business Logic:**
1. Validate query length (min 2 characters)
2. Sanitize query string
3. Build text search filter using `$text` and `$search`
4. Add tags filter if provided (match any of the tags: `$in` operator)
5. Add type filter if provided (validate: "original" or "repost")
6. Add communityId filter if provided (validate ObjectId)
7. Query posts excluding deleted posts (`deletedAt: null`)
8. Sort results alphabetically by content (case-insensitive collation)
9. Apply pagination
10. Populate author (id, username, fullName, profilePicture)
11. Populate community (id, name) if exists
12. If authenticated: Check hasLiked and hasSaved status for each post
13. Return results with pagination metadata

**Edge Cases:**
- Query too short: Return 400 error
- No results found: Return empty array
- Invalid tags: Ignore invalid tags, search with valid ones
- Invalid type: Return 400 error
- Invalid communityId: Return 400 error
- Deleted posts: Excluded from results
- Non-authenticated: No hasLiked/hasSaved fields

**Test Cases:**
File: `/server/spec/controllers/post/searchPostsController.spec.js`
- ✓ Should search posts by content (case-insensitive)
- ✓ Should search posts by tags
- ✓ Should return 400 if query is too short
- ✓ Should return 400 if query is missing
- ✓ Should filter by single tag
- ✓ Should filter by multiple tags (OR logic)
- ✓ Should filter by type (original)
- ✓ Should filter by type (repost)
- ✓ Should return 400 for invalid type
- ✓ Should filter by communityId
- ✓ Should return 400 for invalid communityId
- ✓ Should exclude deleted posts
- ✓ Should return empty array if no results
- ✓ Should sort results alphabetically by content
- ✓ Should include hasLiked field (authenticated)
- ✓ Should include hasSaved field (authenticated)
- ✓ Should not include hasLiked/hasSaved (non-authenticated)
- ✓ Should paginate results correctly
- ✓ Should enforce max results limit
- ✓ Should populate author details
- ✓ Should populate community details
- ✓ Should handle posts without community
- ✓ Should combine multiple filters (tags + type + communityId)

**Dependencies:** Epic 1, Epic 3, T101, T102, T103  
**Blocking:** T107, T108

---

## Phase 4: User Story 3 - Search for Communities

### T106: Implement Search Communities Controller
**Type**: Controller  
**User Story**: US3 - Search for Communities  
**Estimated Effort**: 1 day  
**Can Run in Parallel**: No  
**Priority**: Normal

**Target File:**
- `/server/controllers/community/searchCommunitiesController.js`

**Function to Implement:**
```javascript
async function searchCommunities(req, res) {
  // Extract query parameters
  // Validate query string (minimum length)
  // Parse pagination
  // Build search filter (text search + tags filter)
  // If authenticated: get current user ID for membership status
  // Query communities with filters
  // Sort by member count (descending)
  // For authenticated requests: add isMember field
  // Return paginated results
}
```

**Query Parameters:**
- `q` (string, required): Search query (min 2 chars)
- `tags` (string, optional): Comma-separated tags to filter by
- `page` (integer, optional, default: 1)
- `limit` (integer, optional, default: 20, max: MAX_SEARCH_RESULTS)

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "communityId123",
      "name": "Web Development Hub",
      "description": "Community for web developers",
      "coverImage": "https://...",
      "tags": ["webdev", "javascript", "react"],
      "membersCount": 1250,
      "postsCount": 450,
      "isMember": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

**Business Logic:**
1. Validate query length (min 2 characters)
2. Sanitize query string
3. Build text search filter using `$text` and `$search`
4. Add tags filter if provided (match any of the tags: `$in` operator)
5. Query communities with filters
6. Sort results by membersCount (descending)
7. Apply pagination
8. If authenticated: Check if user is a member of each community (isMember field)
9. Return results with pagination metadata

**Edge Cases:**
- Query too short: Return 400 error
- No results found: Return empty array
- Invalid tags: Ignore invalid tags
- Non-authenticated: No isMember field

**Test Cases:**
File: `/server/spec/controllers/community/searchCommunitiesController.spec.js`
- ✓ Should search communities by name (case-insensitive)
- ✓ Should search communities by description
- ✓ Should search communities by tags
- ✓ Should return 400 if query is too short
- ✓ Should return 400 if query is missing
- ✓ Should filter by single tag
- ✓ Should filter by multiple tags (OR logic)
- ✓ Should return empty array if no results
- ✓ Should sort results by member count (descending)
- ✓ Should include isMember field (authenticated)
- ✓ Should not include isMember field (non-authenticated)
- ✓ Should paginate results correctly
- ✓ Should enforce max results limit
- ✓ Should handle invalid pagination parameters
- ✓ Should combine query and tags filter

**Dependencies:** Epic 1, Epic 6, T101, T102, T103  
**Blocking:** T107, T108

---

## Phase 5: Routes & Integration

### T107: Create Search Routes
**Type**: Routes  
**User Story**: All  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: No  
**Priority**: Normal

**Target File:**
- `/server/routes/searchRoutes.js`

**Routes to Create:**

```javascript
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middlewares/checkAuth');
const { searchUsers } = require('../controllers/user/searchUsersController');
const { searchPosts } = require('../controllers/post/searchPostsController');
const { searchCommunities } = require('../controllers/community/searchCommunitiesController');

/**
 * @route   GET /api/v1/search/users
 * @desc    Search for users by username, name, or bio
 * @access  Public (optional auth for isFollowing status)
 * @query   q (required), specialization, page, limit
 */
router.get('/users', optionalAuth, searchUsers);

/**
 * @route   GET /api/v1/search/posts
 * @desc    Search for posts by content or tags
 * @access  Public (optional auth for hasLiked/hasSaved status)
 * @query   q (required), tags, type, communityId, page, limit
 */
router.get('/posts', optionalAuth, searchPosts);

/**
 * @route   GET /api/v1/search/communities
 * @desc    Search for communities by name or description
 * @access  Public (optional auth for isMember status)
 * @query   q (required), tags, page, limit
 */
router.get('/communities', optionalAuth, searchCommunities);

module.exports = router;
```

**Update `/server/app.js`:**
```javascript
// Add search routes
const searchRoutes = require('./routes/searchRoutes');
app.use('/api/v1/search', searchRoutes);
```

**Note:** 
- All search endpoints use `optionalAuth` middleware
- Non-authenticated users can search but get limited metadata
- Authenticated users get additional fields (isFollowing, hasLiked, hasSaved, isMember)

**Test Cases:**
File: `/server/spec/routes/searchRoutes.spec.js`
- ✓ Should have GET /users route with optionalAuth
- ✓ Should have GET /posts route with optionalAuth
- ✓ Should have GET /communities route with optionalAuth
- ✓ Should call searchUsers controller for /users
- ✓ Should call searchPosts controller for /posts
- ✓ Should call searchCommunities controller for /communities

**Dependencies:** T104, T105, T106  
**Blocking:** T108, T109

---

### T108: Create Search Integration Tests
**Type**: Integration Tests  
**User Story**: All  
**Estimated Effort**: 1.5 days  
**Can Run in Parallel**: No  
**Priority**: Normal

**Target File:**
- `/server/spec/integration/search.integration.spec.js`

**Test Suites:**

**1. Search Users Integration Tests:**
- ✓ Should search users and return results
- ✓ Should search users by username (case-insensitive)
- ✓ Should search users by full name
- ✓ Should search users by bio
- ✓ Should filter users by specialization
- ✓ Should return 400 for query too short
- ✓ Should return empty array for no matches
- ✓ Should sort results alphabetically
- ✓ Should exclude blocked users (authenticated)
- ✓ Should include isFollowing field (authenticated)
- ✓ Should not include isFollowing field (non-authenticated)
- ✓ Should paginate results correctly
- ✓ Should enforce max results limit
- ✓ Should not expose sensitive data (email, password)

**2. Search Posts Integration Tests:**
- ✓ Should search posts and return results
- ✓ Should search posts by content (case-insensitive)
- ✓ Should search posts by tags
- ✓ Should filter by single tag
- ✓ Should filter by multiple tags
- ✓ Should filter by type (original)
- ✓ Should filter by type (repost)
- ✓ Should filter by communityId
- ✓ Should return 400 for invalid type
- ✓ Should return 400 for invalid communityId
- ✓ Should return 400 for query too short
- ✓ Should exclude deleted posts
- ✓ Should return empty array for no matches
- ✓ Should sort results alphabetically
- ✓ Should include hasLiked field (authenticated)
- ✓ Should include hasSaved field (authenticated)
- ✓ Should not include hasLiked/hasSaved (non-authenticated)
- ✓ Should paginate results correctly
- ✓ Should populate author details
- ✓ Should populate community details
- ✓ Should combine multiple filters

**3. Search Communities Integration Tests:**
- ✓ Should search communities and return results
- ✓ Should search communities by name (case-insensitive)
- ✓ Should search communities by description
- ✓ Should search communities by tags
- ✓ Should filter by single tag
- ✓ Should filter by multiple tags
- ✓ Should return 400 for query too short
- ✓ Should return empty array for no matches
- ✓ Should sort results by member count (descending)
- ✓ Should include isMember field (authenticated)
- ✓ Should not include isMember field (non-authenticated)
- ✓ Should paginate results correctly
- ✓ Should enforce max results limit

**Total Test Cases:** 50+ integration scenarios

**Test Setup:**
- Create test database with sample users, posts, communities
- Create authenticated and non-authenticated test contexts
- Seed data with various searchable content
- Test with different query lengths and pagination

**Dependencies:** T104, T105, T106, T107  
**Blocking:** None

---

### T109: Update API Documentation for Search
**Type**: Documentation  
**User Story**: All  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: Yes (after T107)  
**Priority**: Normal

**Target File:**
- `/server/docs/search.yaml`

**Documentation to Include:**

```yaml
openapi: 3.0.0
info:
  title: ITI Hub - Search API
  version: 1.0.0
  description: Search endpoints for users, posts, and communities

paths:
  /search/users:
    get:
      summary: Search for users
      description: Search users by username, full name, or bio. Supports specialization filter and pagination.
      tags:
        - Search
      security:
        - bearerAuth: []  # Optional
      parameters:
        - name: q
          in: query
          required: true
          description: Search query (minimum 2 characters)
          schema:
            type: string
            minLength: 2
        - name: specialization
          in: query
          required: false
          description: Filter by user specialization
          schema:
            type: string
        - name: page
          in: query
          required: false
          description: Page number
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          required: false
          description: Results per page
          schema:
            type: integer
            minimum: 1
            maximum: 50
            default: 20
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/UserSearchResult'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '400':
          description: Invalid query parameters

  /search/posts:
    get:
      summary: Search for posts
      description: Search posts by content or tags. Supports filters for tags, type, and community.
      tags:
        - Search
      security:
        - bearerAuth: []  # Optional
      parameters:
        - name: q
          in: query
          required: true
          description: Search query (minimum 2 characters)
          schema:
            type: string
            minLength: 2
        - name: tags
          in: query
          required: false
          description: Comma-separated tags to filter by
          schema:
            type: string
        - name: type
          in: query
          required: false
          description: Post type filter
          schema:
            type: string
            enum: [original, repost]
        - name: communityId
          in: query
          required: false
          description: Filter by community ID
          schema:
            type: string
        - name: page
          in: query
          required: false
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            default: 20
            maximum: 50
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/PostSearchResult'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

  /search/communities:
    get:
      summary: Search for communities
      description: Search communities by name or description. Results sorted by member count.
      tags:
        - Search
      security:
        - bearerAuth: []  # Optional
      parameters:
        - name: q
          in: query
          required: true
          description: Search query (minimum 2 characters)
          schema:
            type: string
            minLength: 2
        - name: tags
          in: query
          required: false
          description: Comma-separated tags to filter by
          schema:
            type: string
        - name: page
          in: query
          required: false
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            default: 20
            maximum: 50
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/CommunitySearchResult'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

components:
  schemas:
    UserSearchResult:
      type: object
      properties:
        id:
          type: string
        username:
          type: string
        fullName:
          type: string
        profilePicture:
          type: string
        bio:
          type: string
        specialization:
          type: string
        followersCount:
          type: integer
        followingCount:
          type: integer
        isFollowing:
          type: boolean
          description: Only present when authenticated
    
    PostSearchResult:
      type: object
      properties:
        id:
          type: string
        content:
          type: string
        images:
          type: array
          items:
            type: string
        tags:
          type: array
          items:
            type: string
        type:
          type: string
          enum: [original, repost]
        author:
          $ref: '#/components/schemas/Author'
        community:
          $ref: '#/components/schemas/CommunityBrief'
        likesCount:
          type: integer
        commentsCount:
          type: integer
        repostsCount:
          type: integer
        savesCount:
          type: integer
        hasLiked:
          type: boolean
          description: Only present when authenticated
        hasSaved:
          type: boolean
          description: Only present when authenticated
        createdAt:
          type: string
          format: date-time
    
    CommunitySearchResult:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        coverImage:
          type: string
        tags:
          type: array
          items:
            type: string
        membersCount:
          type: integer
        postsCount:
          type: integer
        isMember:
          type: boolean
          description: Only present when authenticated
        createdAt:
          type: string
          format: date-time
    
    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        pages:
          type: integer
```

**Update `/server/docs/index.js`:**
```javascript
const searchDocs = require('./search.yaml');

// Add to docs export
module.exports = {
  // ... existing docs
  search: searchDocs
};
```

**Documentation Notes:**
- All endpoints support optional authentication
- Minimum query length: 2 characters
- Maximum results per page: 50 (configurable in constants)
- Results are sorted differently per endpoint (alphabetical for users/posts, member count for communities)
- Authenticated requests include additional relationship fields

**Dependencies:** T107  
**Blocking:** None

---

## Epic 9 Completion Criteria

**All Tasks Completed:**
- [ ] T101: Update Constants for Search Configuration ✅
- [ ] T102: Create Text Indexes on Models ✅
- [ ] T103: Create Search Helper Utilities ✅
- [ ] T104: Implement Search Users Controller ✅
- [ ] T105: Implement Search Posts Controller ✅
- [ ] T106: Implement Search Communities Controller ✅
- [ ] T107: Create Search Routes ✅
- [ ] T108: Create Search Integration Tests ✅
- [ ] T109: Update API Documentation for Search ✅

**Quality Metrics:**
- [ ] All unit test cases passing (70+ scenarios)
- [ ] All integration test cases passing (50+ scenarios)
- [ ] Text indexes created and functional
- [ ] Search query validation working (min 2 chars)
- [ ] User search working (username, name, bio)
- [ ] Post search working (content, tags, filters)
- [ ] Community search working (name, description, tags)
- [ ] Alphabetical sorting working (users, posts)
- [ ] Member count sorting working (communities)
- [ ] Blocked users excluded from user search (authenticated)
- [ ] Pagination working correctly
- [ ] Max results limit enforced
- [ ] Optional authentication working (additional fields for authenticated users)
- [ ] API documentation complete
- [ ] Manual testing successful

**Performance Targets:**
- [ ] User search: < 200ms for typical queries
- [ ] Post search: < 300ms for typical queries
- [ ] Community search: < 200ms for typical queries
- [ ] Text indexes improve query performance by > 10x vs full collection scan

**Notes:**
- No search history or trending searches in MVP
- No autocomplete/suggestions in MVP
- No advanced ranking algorithm (simple alphabetical/member count sorting)
- Future enhancements: user filters (branch, track, role), post date range filters, combined search endpoint

---

**Epic 9 Status**: ⬜ Not Started  
**Target Completion**: December 23, 2025  
**Depends on**: Epic 1 ✅, Epic 2 ✅, Epic 3 ✅, Epic 6 ✅
