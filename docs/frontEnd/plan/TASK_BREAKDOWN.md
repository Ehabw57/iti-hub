# Frontend Task Breakdown - ITI Hub

**Project**: ITI Hub Frontend Implementation  
**Format**: Detailed task breakdown with dependencies and estimates  
**Timeline**: 4 weeks (20 working days)

## Task Estimation Key
- **XS**: 1-2 hours
- **S**: 2-4 hours
- **M**: 4-8 hours (1 day)
- **L**: 8-16 hours (2 days)
- **XL**: 16+ hours (3+ days)

---

## Sprint 0: Setup & Infrastructure (Pre-Sprint)
**Duration**: 2 days  
**Goal**: Prepare development environment

### SETUP-001: Install Dependencies
**Estimate**: S (2-3 hours)  
**Priority**: Critical  
**Dependencies**: None

**Tasks**:
- [ ] Install react-hook-form
- [ ] Install testing libraries (vitest, @testing-library/react)
- [ ] Install MSW for API mocking
- [ ] Verify all package versions match plan
- [ ] Run `npm install` and resolve conflicts

**Acceptance Criteria**:
- All dependencies installed without errors
- `package.json` matches required versions
- `npm run dev` starts successfully

---

### SETUP-002: Configure Build Tools
**Estimate**: M (4-6 hours)  
**Priority**: Critical  
**Dependencies**: SETUP-001

**Tasks**:
- [ ] Update `vite.config.js` with test configuration
- [ ] Configure Tailwind for RTL support
- [ ] Setup path aliases (@components, @hooks, etc.)
- [ ] Configure environment variables
- [ ] Setup code splitting rules

**Acceptance Criteria**:
- Vite builds successfully
- Tests can be run with `npm test`
- Hot reload works
- RTL direction toggles work

**Files to Create/Modify**:
```
vite.config.js
tailwind.config.js
.env.development
.env.production
```

---

### SETUP-003: Create Project Structure
**Estimate**: S (2-3 hours)  
**Priority**: Critical  
**Dependencies**: SETUP-002

**Tasks**:
- [ ] Create folder structure as per plan
- [ ] Create `.gitkeep` files for empty directories
- [ ] Setup index files for clean imports
- [ ] Create README in each major directory

**Acceptance Criteria**:
- All directories exist
- Import aliases work
- Clear documentation in each folder

---

### SETUP-004: Configure State Management
**Estimate**: M (5-6 hours)  
**Priority**: Critical  
**Dependencies**: SETUP-001

**Tasks**:
- [ ] Create `authStore.js` with Zustand
- [ ] Create `uiStore.js` with Zustand
- [ ] Create `socketStore.js` with Zustand
- [ ] Setup store persistence
- [ ] Write unit tests for stores

**Deliverables**:
```javascript
src/store/
├── authStore.js      // Auth state management
├── uiStore.js        // UI preferences (theme, locale, dir)
├── socketStore.js    // WebSocket connection state
└── index.js          // Export all stores
```

**Acceptance Criteria**:
- Stores persist to localStorage
- State updates trigger re-renders
- Tests pass for all stores

---

### SETUP-005: Configure React Query
**Estimate**: M (4-5 hours)  
**Priority**: Critical  
**Dependencies**: SETUP-004

**Tasks**:
- [ ] Create `queryClient.js` with configuration
- [ ] Setup error handling for token expiry
- [ ] Configure cache times and stale times
- [ ] Setup dev tools
- [ ] Write example query hook

**Deliverables**:
```javascript
src/lib/queryClient.js
src/hooks/queries/example.js
```

**Acceptance Criteria**:
- Query client configured with defaults
- Error handling works for auth errors
- Dev tools accessible in browser

---

### SETUP-006: Configure Axios & API Client
**Estimate**: M (4-5 hours)  
**Priority**: Critical  
**Dependencies**: SETUP-004

**Tasks**:
- [ ] Create axios instance with base URL
- [ ] Setup request interceptor (add auth token)
- [ ] Setup response interceptor (handle errors)
- [ ] Create API helper functions
- [ ] Write unit tests for interceptors

**Deliverables**:
```javascript
src/lib/api.js
src/lib/apiHelpers.js
```

**Acceptance Criteria**:
- Auth token automatically added to requests
- Token expiry triggers logout
- Error responses are standardized

---

### SETUP-007: Configure i18n (Intlayer)
**Estimate**: M (5-6 hours)  
**Priority**: Critical  
**Dependencies**: SETUP-002

**Tasks**:
- [ ] Update `intlayer.config.ts` for AR/EN
- [ ] Create language switcher component
- [ ] Setup RTL detection and application
- [ ] Create example content file
- [ ] Test language switching

**Deliverables**:
```typescript
intlayer.config.ts (updated)
src/components/common/LanguageSwitcher.jsx
src/content/example.content.ts
```

**Acceptance Criteria**:
- Language switches between EN/AR
- RTL applied automatically for Arabic
- Text renders in correct language

---

### SETUP-008: Setup Testing Infrastructure
**Estimate**: M (6-8 hours)  
**Priority**: High  
**Dependencies**: SETUP-001, SETUP-002

**Tasks**:
- [ ] Create `tests/setup.js` with global config
- [ ] Setup MSW handlers for API mocking
- [ ] Create test utilities and helpers
- [ ] Write example unit test
- [ ] Write example integration test
- [ ] Configure coverage reporting

**Deliverables**:
```javascript
tests/setup.js
tests/mocks/handlers.js
tests/utils/testUtils.jsx
tests/example.test.jsx
```

**Acceptance Criteria**:
- Tests run with `npm test`
- Coverage report generates
- MSW intercepts API calls
- Example tests pass

---

## Sprint 1: Authentication (Week 1)
**Duration**: 5 days  
**Goal**: Implement complete authentication system

### AUTH-001: Create Reusable UI Components
**Estimate**: L (8-12 hours)  
**Priority**: Critical  
**Dependencies**: SETUP-007

**Tasks**:
- [ ] Create Button component (variants, sizes, loading)
- [ ] Create Input component (text, email, password, error states)
- [ ] Create Card component
- [ ] Create Loading component (spinner, skeleton)
- [ ] Create ErrorDisplay component
- [ ] Write unit tests for all
- [ ] Create Storybook stories (optional)

**Deliverables**:
```javascript
src/components/common/
├── Button.jsx
├── Input.jsx
├── Card.jsx
├── Loading.jsx
├── ErrorDisplay.jsx
└── index.js
```

**Acceptance Criteria**:
- All components support RTL
- All components have loading/error states
- All components have unit tests
- Components use Tailwind for styling

---

### AUTH-002: Implement Login Page
**Estimate**: L (10-12 hours)  
**Priority**: Critical  
**Dependencies**: AUTH-001, SETUP-005, SETUP-006

**Tasks**:
- [ ] Create `AuthLoginController.jsx`
- [ ] Create `LoginForm.jsx` with React Hook Form
- [ ] Create `useLogin` mutation hook
- [ ] Implement rate limit cooldown
- [ ] Add field validation (email, password)
- [ ] Add server error mapping
- [ ] Create i18n content file
- [ ] Write unit tests
- [ ] Write integration test

**Deliverables**:
```javascript
src/pages/auth/
├── AuthLoginController.jsx
├── LoginForm.jsx
└── login.content.ts

src/hooks/mutations/
└── useLogin.js

tests/integration/
└── auth-login.test.jsx
```

**Acceptance Criteria**:
- Login works with valid credentials
- Invalid credentials show error
- Rate limiting shows cooldown
- Redirects to home after success
- Works in both EN and AR
- RTL layout correct
- Tests pass

---

### AUTH-003: Implement Register Page
**Estimate**: L (10-12 hours)  
**Priority**: Critical  
**Dependencies**: AUTH-001, AUTH-002

**Tasks**:
- [ ] Create `AuthRegisterController.jsx`
- [ ] Create `RegisterForm.jsx` with React Hook Form
- [ ] Create `useRegister` mutation hook
- [ ] Implement password policy validation
- [ ] Add field validation (email, password, username, fullName)
- [ ] Add server error mapping
- [ ] Create i18n content file
- [ ] Write unit tests
- [ ] Write integration test

**Deliverables**:
```javascript
src/pages/auth/
├── AuthRegisterController.jsx
├── RegisterForm.jsx
└── register.content.ts

src/hooks/mutations/
└── useRegister.js
```

**Acceptance Criteria**:
- Registration works with valid data
- Password policy enforced client-side
- Duplicate email/username handled
- Redirects to home after success
- Works in both EN and AR
- Tests pass

---

### AUTH-004: Implement Password Reset
**Estimate**: M (6-8 hours)  
**Priority**: High  
**Dependencies**: AUTH-001, AUTH-002

**Tasks**:
- [ ] Create `PasswordResetRequest.jsx`
- [ ] Create `PasswordResetConfirm.jsx`
- [ ] Create mutation hooks
- [ ] Add validation
- [ ] Create i18n content files
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/auth/
├── PasswordResetRequest.jsx
├── PasswordResetConfirm.jsx
├── passwordResetRequest.content.ts
└── passwordResetConfirm.content.ts

src/hooks/mutations/
├── usePasswordResetRequest.js
└── usePasswordResetConfirm.js
```

**Acceptance Criteria**:
- Reset email sent successfully
- Token validation works
- New password saved
- Works in both languages
- Tests pass

---

### AUTH-005: Implement Protected Routes
**Estimate**: M (4-6 hours)  
**Priority**: Critical  
**Dependencies**: AUTH-002

**Tasks**:
- [ ] Create `ProtectedRoute.jsx` component
- [ ] Create `PublicRoute.jsx` component (auth redirect)
- [ ] Setup route guards
- [ ] Handle token expiry redirects
- [ ] Write tests

**Deliverables**:
```javascript
src/routes/
├── ProtectedRoute.jsx
├── PublicRoute.jsx
└── index.jsx
```

**Acceptance Criteria**:
- Unauthenticated users redirected to login
- Authenticated users can't access login/register
- Token expiry handled gracefully
- Tests pass

---

## Sprint 2: Feed & Posts (Week 2)
**Duration**: 5 days  
**Goal**: Implement feed functionality and post creation

### FEED-001: Implement Feed Home Page
**Estimate**: XL (12-16 hours)  
**Priority**: Critical  
**Dependencies**: AUTH-005, SETUP-005

**Tasks**:
- [ ] Create `FeedHomeController.jsx`
- [ ] Create `FeedList.jsx` component
- [ ] Create `FeedPostItem.jsx` component
- [ ] Create `useFeedHome` infinite query hook
- [ ] Implement infinite scroll with Intersection Observer
- [ ] Create like/save/repost mutation hooks
- [ ] Implement optimistic updates
- [ ] Add loading skeletons
- [ ] Create i18n content file
- [ ] Write unit tests
- [ ] Write integration tests

**Deliverables**:
```javascript
src/pages/feed/
├── FeedHomeController.jsx
├── FeedList.jsx
├── FeedPostItem.jsx
└── feedHome.content.ts

src/hooks/queries/
└── useFeedHome.js

src/hooks/mutations/
├── useLikePost.js
├── useSavePost.js
└── useRepostPost.js

src/components/feed/
├── PostSkeleton.jsx
└── FeedEmpty.jsx
```

**Acceptance Criteria**:
- Feed loads with pagination
- Infinite scroll works smoothly
- Like/save updates optimistically
- Rollback works on error
- Repost creates new post
- Loading states shown
- Empty state shown
- Works in both languages
- RTL layout correct
- Tests pass

---

### FEED-002: Implement Following & Trending Feeds
**Estimate**: M (6-8 hours)  
**Priority**: High  
**Dependencies**: FEED-001

**Tasks**:
- [ ] Create `FeedFollowingController.jsx`
- [ ] Create `FeedTrendingController.jsx`
- [ ] Create query hooks
- [ ] Reuse feed components from FEED-001
- [ ] Create i18n content files
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/feed/
├── FeedFollowingController.jsx
├── FeedTrendingController.jsx
├── feedFollowing.content.ts
└── feedTrending.content.ts

src/hooks/queries/
├── useFeedFollowing.js
└── useFeedTrending.js
```

**Acceptance Criteria**:
- Following feed shows followed users' posts
- Trending feed shows popular posts
- Same UX as home feed
- Tests pass

---

### POST-001: Implement Post Composer
**Estimate**: XL (12-16 hours)  
**Priority**: Critical  
**Dependencies**: AUTH-005

**Tasks**:
- [ ] Create `PostComposerController.jsx`
- [ ] Create `PostComposerForm.jsx` with React Hook Form
- [ ] Implement file upload with validation
- [ ] Create image preview with remove option
- [ ] Add community selector (optional)
- [ ] Add tag input (optional)
- [ ] Create `useCreatePost` mutation hook
- [ ] Implement memory cleanup for previews
- [ ] Create i18n content file
- [ ] Write unit tests
- [ ] Write integration test

**Deliverables**:
```javascript
src/pages/post/
├── PostComposerController.jsx
├── PostComposerForm.jsx
└── postComposer.content.ts

src/hooks/mutations/
└── useCreatePost.js

src/components/post/
├── ImagePreview.jsx
└── CommunitySelector.jsx
```

**Acceptance Criteria**:
- Post creates with text only
- Post creates with images
- Image validation works (type, size)
- Preview shows selected images
- Memory cleaned up on unmount
- Redirects to home with new post at top
- Works in both languages
- Tests pass

---

### POST-002: Implement Post Detail Page
**Estimate**: XL (14-18 hours)  
**Priority**: Critical  
**Dependencies**: FEED-001

**Tasks**:
- [ ] Create `PostDetailController.jsx`
- [ ] Create `PostContent.jsx` component
- [ ] Create `PostActions.jsx` component
- [ ] Create `CommentComposer.jsx` with React Hook Form
- [ ] Create `CommentList.jsx` component
- [ ] Create `CommentItem.jsx` component
- [ ] Implement comment CRUD operations
- [ ] Implement nested replies
- [ ] Create query/mutation hooks
- [ ] Create i18n content file
- [ ] Write unit tests
- [ ] Write integration tests

**Deliverables**:
```javascript
src/pages/post/
├── PostDetailController.jsx
├── PostContent.jsx
├── PostActions.jsx
├── CommentComposer.jsx
├── CommentList.jsx
├── CommentItem.jsx
└── postDetail.content.ts

src/hooks/queries/
├── usePost.js
└── useComments.js

src/hooks/mutations/
├── useCreateComment.js
├── useUpdateComment.js
├── useDeleteComment.js
└── useLikeComment.js
```

**Acceptance Criteria**:
- Post displays with all details
- Comments load with pagination
- Replies can be nested
- Comment CRUD works
- Like/unlike works on comments
- Blocked content hidden
- Works in both languages
- Tests pass

---

### POST-003: Implement Saved Posts Page
**Estimate**: M (6-8 hours)  
**Priority**: Medium  
**Dependencies**: FEED-001

**Tasks**:
- [ ] Create `SavedPostsController.jsx`
- [ ] Create `useSavedPosts` query hook
- [ ] Reuse feed components
- [ ] Add unsave functionality
- [ ] Create i18n content file
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/post/
├── SavedPostsController.jsx
└── savedPosts.content.ts

src/hooks/queries/
└── useSavedPosts.js
```

**Acceptance Criteria**:
- Saved posts display correctly
- Unsave removes from list
- Works like regular feed
- Tests pass

---

## Sprint 3: Social & Real-time (Week 3)
**Duration**: 5 days  
**Goal**: Implement profiles, messaging, notifications

### USER-001: Implement User Profile Page
**Estimate**: XL (14-16 hours)  
**Priority**: Critical  
**Dependencies**: FEED-001

**Tasks**:
- [ ] Create `UserProfileController.jsx`
- [ ] Create `ProfileHeader.jsx` component
- [ ] Create `ProfileTabs.jsx` component (Posts, About)
- [ ] Create `EditProfileModal.jsx` with React Hook Form
- [ ] Implement follow/unfollow functionality
- [ ] Implement block/unblock functionality
- [ ] Create query/mutation hooks
- [ ] Create i18n content file
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/user/
├── UserProfileController.jsx
├── ProfileHeader.jsx
├── ProfileTabs.jsx
├── EditProfileModal.jsx
└── userProfile.content.ts

src/hooks/queries/
├── useUserProfile.js
└── useUserPosts.js

src/hooks/mutations/
├── useFollowUser.js
├── useUnfollowUser.js
├── useBlockUser.js
├── useUnblockUser.js
└── useUpdateProfile.js
```

**Acceptance Criteria**:
- Profile displays user info
- Posts tab shows user's posts
- Follow/unfollow works
- Block/unblock works
- Profile editing works
- Image uploads work
- Works in both languages
- Tests pass

---

### USER-002: Implement Followers/Following Pages
**Estimate**: M (8-10 hours)  
**Priority**: Medium  
**Dependencies**: USER-001

**Tasks**:
- [ ] Create `UserFollowersController.jsx`
- [ ] Create `UserFollowingController.jsx`
- [ ] Create `UserListItem.jsx` component
- [ ] Create query hooks
- [ ] Add follow/unfollow functionality
- [ ] Create i18n content files
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/user/
├── UserFollowersController.jsx
├── UserFollowingController.jsx
├── UserListItem.jsx
├── userFollowers.content.ts
└── userFollowing.content.ts

src/hooks/queries/
├── useUserFollowers.js
└── useUserFollowing.js
```

**Acceptance Criteria**:
- Lists display correctly
- Pagination works
- Follow/unfollow from list works
- Works in both languages
- Tests pass

---

### MSG-001: Setup WebSocket Connection
**Estimate**: M (6-8 hours)  
**Priority**: Critical  
**Dependencies**: SETUP-004

**Tasks**:
- [ ] Create WebSocket connection utility
- [ ] Create `useSocket` hook
- [ ] Setup connection/disconnection logic
- [ ] Setup reconnection strategy
- [ ] Handle auth token in connection
- [ ] Write tests

**Deliverables**:
```javascript
src/lib/socket.js
src/hooks/socket/useSocket.js
src/store/socketStore.js
```

**Acceptance Criteria**:
- Socket connects with auth token
- Reconnects automatically on disconnect
- Store tracks connection state
- Tests pass

---

### MSG-002: Implement Messages List
**Estimate**: L (10-12 hours)  
**Priority**: Critical  
**Dependencies**: MSG-001

**Tasks**:
- [ ] Create `MessagesListController.jsx`
- [ ] Create `ConversationItem.jsx` component
- [ ] Create `useConversations` query hook
- [ ] Setup real-time updates via socket
- [ ] Add unread count badges
- [ ] Create i18n content file
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/messaging/
├── MessagesListController.jsx
├── ConversationItem.jsx
└── messagesList.content.ts

src/hooks/queries/
└── useConversations.js

src/hooks/socket/
└── useConversationsSocket.js
```

**Acceptance Criteria**:
- Conversations list displays
- Unread counts show
- Real-time updates work
- Last message updates
- Works in both languages
- Tests pass

---

### MSG-003: Implement Conversation Detail
**Estimate**: XL (16-20 hours)  
**Priority**: Critical  
**Dependencies**: MSG-002

**Tasks**:
- [ ] Create `ConversationDetailController.jsx`
- [ ] Create `MessageList.jsx` component
- [ ] Create `MessageItem.jsx` component
- [ ] Create `MessageInput.jsx` with React Hook Form
- [ ] Implement cursor pagination
- [ ] Setup real-time message delivery
- [ ] Implement typing indicators
- [ ] Implement mark as seen
- [ ] Add image upload in messages
- [ ] Create group management UI
- [ ] Create query/mutation hooks
- [ ] Create i18n content file
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/messaging/
├── ConversationDetailController.jsx
├── MessageList.jsx
├── MessageItem.jsx
├── MessageInput.jsx
├── TypingIndicator.jsx
├── GroupManagement.jsx
└── conversationDetail.content.ts

src/hooks/queries/
├── useConversation.js
└── useMessages.js

src/hooks/mutations/
├── useSendMessage.js
├── useMarkAsSeen.js
├── useAddMember.js
└── useRemoveMember.js

src/hooks/socket/
└── useMessagingSocket.js
```

**Acceptance Criteria**:
- Messages display in correct order
- Cursor pagination works
- Real-time message delivery
- Typing indicators show/hide
- Mark as seen works
- Image upload works
- Group management works
- Works in both languages
- Tests pass

---

### NOTIF-001: Implement Notifications Center
**Estimate**: L (12-14 hours)  
**Priority**: Critical  
**Dependencies**: MSG-001

**Tasks**:
- [ ] Create `NotificationsCenterController.jsx`
- [ ] Create `NotificationItem.jsx` component
- [ ] Create `NotificationGroup.jsx` component
- [ ] Create query/mutation hooks
- [ ] Setup real-time updates via socket
- [ ] Implement mark as read
- [ ] Add unread count badge
- [ ] Create i18n content file
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/notifications/
├── NotificationsCenterController.jsx
├── NotificationItem.jsx
├── NotificationGroup.jsx
└── notificationsCenter.content.ts

src/hooks/queries/
├── useNotifications.js
└── useUnreadCount.js

src/hooks/mutations/
├── useMarkNotificationRead.js
└── useMarkAllRead.js

src/hooks/socket/
└── useNotificationsSocket.js
```

**Acceptance Criteria**:
- Notifications display with grouping
- Real-time updates work
- Mark as read works
- Unread count updates
- Works in both languages
- Tests pass

---

### SEARCH-001: Implement Search Page
**Estimate**: L (10-12 hours)  
**Priority**: High  
**Dependencies**: USER-001

**Tasks**:
- [ ] Create `SearchController.jsx`
- [ ] Create `SearchTabs.jsx` component
- [ ] Create `SearchInput.jsx` with debounce
- [ ] Create `UserSearchResults.jsx`
- [ ] Create `PostSearchResults.jsx`
- [ ] Create `CommunitySearchResults.jsx`
- [ ] Create query hooks for each tab
- [ ] Create i18n content file
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/search/
├── SearchController.jsx
├── SearchTabs.jsx
├── SearchInput.jsx
├── UserSearchResults.jsx
├── PostSearchResults.jsx
├── CommunitySearchResults.jsx
└── search.content.ts

src/hooks/queries/
├── useSearchUsers.js
├── useSearchPosts.js
└── useSearchCommunities.js
```

**Acceptance Criteria**:
- Search works across all tabs
- Debounce prevents excessive requests
- Results paginate
- Filters work
- Works in both languages
- Tests pass

---

## Sprint 4: Communities & Polish (Week 4)
**Duration**: 5 days  
**Goal**: Implement communities and finalize

### COMM-001: Implement Communities Directory
**Estimate**: L (10-12 hours)  
**Priority**: High  
**Dependencies**: AUTH-005

**Tasks**:
- [ ] Create `CommunitiesDirectoryController.jsx`
- [ ] Create `CommunityCard.jsx` component
- [ ] Create `CommunityFilters.jsx` component
- [ ] Create query hook
- [ ] Implement search and filtering
- [ ] Add join/leave functionality
- [ ] Create i18n content file
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/community/
├── CommunitiesDirectoryController.jsx
├── CommunityCard.jsx
├── CommunityFilters.jsx
└── communitiesDirectory.content.ts

src/hooks/queries/
└── useCommunities.js

src/hooks/mutations/
├── useJoinCommunity.js
└── useLeaveCommunity.js
```

**Acceptance Criteria**:
- Communities list displays
- Search works
- Tag filtering works
- Join/leave works
- Pagination works
- Tests pass

---

### COMM-002: Implement Community Detail
**Estimate**: L (12-14 hours)  
**Priority**: High  
**Dependencies**: COMM-001, FEED-001

**Tasks**:
- [ ] Create `CommunityDetailController.jsx`
- [ ] Create `CommunityHeader.jsx` component
- [ ] Create `CommunityFeed.jsx` (reuse feed components)
- [ ] Create query hooks
- [ ] Add moderation actions for mods/owners
- [ ] Create i18n content file
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/community/
├── CommunityDetailController.jsx
├── CommunityHeader.jsx
├── CommunityFeed.jsx
└── communityDetail.content.ts

src/hooks/queries/
├── useCommunity.js
└── useCommunityFeed.js
```

**Acceptance Criteria**:
- Community displays details
- Feed shows community posts
- Moderation actions work for authorized users
- Join/leave works
- Tests pass

---

### COMM-003: Implement Community Create/Edit
**Estimate**: M (8-10 hours)  
**Priority**: Medium  
**Dependencies**: COMM-001

**Tasks**:
- [ ] Create `CommunityCreateController.jsx`
- [ ] Create `CommunityEditController.jsx`
- [ ] Create `CommunityForm.jsx` with React Hook Form
- [ ] Implement image uploads (profile, cover)
- [ ] Add tag selection
- [ ] Create mutation hooks
- [ ] Create i18n content files
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/community/
├── CommunityCreateController.jsx
├── CommunityEditController.jsx
├── CommunityForm.jsx
├── communityCreate.content.ts
└── communityEdit.content.ts

src/hooks/mutations/
├── useCreateCommunity.js
└── useUpdateCommunity.js
```

**Acceptance Criteria**:
- Community creation works
- Community editing works (owner only)
- Image uploads work
- Tag selection works
- Tests pass

---

### COMM-004: Implement Community Moderation
**Estimate**: M (8-10 hours)  
**Priority**: Low  
**Dependencies**: COMM-002

**Tasks**:
- [ ] Create `CommunityModerationController.jsx`
- [ ] Create `MemberList.jsx` component
- [ ] Create `ModeratorManagement.jsx` component
- [ ] Add/remove moderator functionality
- [ ] Remove member functionality
- [ ] Create mutation hooks
- [ ] Create i18n content file
- [ ] Write tests

**Deliverables**:
```javascript
src/pages/community/
├── CommunityModerationController.jsx
├── MemberList.jsx
├── ModeratorManagement.jsx
└── communityModeration.content.ts

src/hooks/mutations/
├── useAddModerator.js
├── useRemoveModerator.js
└── useRemoveMember.js
```

**Acceptance Criteria**:
- Only owners can access
- Add/remove moderators works
- Remove member works
- Tests pass

---

### POLISH-001: Performance Optimization
**Estimate**: L (10-12 hours)  
**Priority**: High  
**Dependencies**: All features complete

**Tasks**:
- [ ] Implement code splitting for routes
- [ ] Optimize bundle size
- [ ] Add lazy loading for images
- [ ] Implement loading skeletons everywhere
- [ ] Optimize React Query cache
- [ ] Add service worker (optional)
- [ ] Run Lighthouse audits
- [ ] Fix performance issues

**Acceptance Criteria**:
- Bundle size < 500KB gzipped
- Lighthouse score > 90
- First contentful paint < 1.5s
- No console errors/warnings

---

### POLISH-002: Testing & Coverage
**Estimate**: L (12-16 hours)  
**Priority**: Critical  
**Dependencies**: All features complete

**Tasks**:
- [ ] Achieve >80% unit test coverage
- [ ] Write missing integration tests
- [ ] Add E2E tests for critical flows
- [ ] Fix failing tests
- [ ] Add accessibility tests
- [ ] Generate coverage report

**Acceptance Criteria**:
- Test coverage > 80%
- All tests pass
- No flaky tests
- Coverage report generated

---

### POLISH-003: Documentation & Deployment
**Estimate**: M (6-8 hours)  
**Priority**: High  
**Dependencies**: POLISH-001, POLISH-002

**Tasks**:
- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Create deployment guide
- [ ] Setup CI/CD pipeline
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Fix bugs
- [ ] Deploy to production

**Acceptance Criteria**:
- Documentation complete
- CI/CD working
- Staging deployed and tested
- Production deployed
- Monitoring setup

---

## Summary

### Total Tasks: 43
- Setup: 8 tasks
- Sprint 1 (Auth): 5 tasks
- Sprint 2 (Feed/Posts): 6 tasks
- Sprint 3 (Social/Real-time): 7 tasks
- Sprint 4 (Communities/Polish): 8 tasks

### Total Estimated Time: ~400 hours
- Sprint 0: ~40 hours (2 days with 2 devs)
- Sprint 1: ~80 hours (1 week with 2 devs)
- Sprint 2: ~100 hours (1 week with 2 devs)
- Sprint 3: ~120 hours (1 week with 2 devs)
- Sprint 4: ~100 hours (1 week with 2 devs)

### Team Size: 2-3 developers
### Timeline: 4 weeks + 2 days setup

---

**Document Version**: 1.0  
**Last Updated**: December 18, 2025  
**Owner**: Frontend Team
