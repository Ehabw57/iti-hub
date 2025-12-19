# Frontend Component Specifications

This directory contains logic-first React component specifications for the ITI Hub social media platform.

## 📋 Quick Start

1. **Read First**: [COMPLETE_SUMMARY.md](./COMPLETE_SUMMARY.md) - Overview of all deliverables
2. **Learn Patterns**: [TECH_STACK_GUIDE.md](./TECH_STACK_GUIDE.md) - Comprehensive implementation patterns
3. **Track Progress**: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Component completion status

## 🎯 Tech Stack

- **Framework**: React 19 with JSX
- **State**: Zustand (auth) + React Query (server state)
- **Routing**: React Router DOM v7
- **UI**: Headless UI + Tailwind CSS v4
- **Forms**: React Hook Form
- **i18n**: Intlayer (AR/EN with full RTL)
- **Real-time**: Socket.io Client v4
- **HTTP**: axios
- **Notifications**: react-hot-toast

## 📁 Component Specifications (23 Total)

### ✅ Fully Enhanced (5)
- **AUTH_LOGIN.md** - Login form with rate limiting
- **AUTH_REGISTER.md** - Registration with password policy
- **FEED_HOME.md** - Infinite scroll feed with optimistic updates
- **POST_COMPOSER.md** - Post creation with file upload
- **POST_DETAIL.md** - Post detail with comments (needs tech section)

### 🔄 Existing (Need Tech Stack Enhancement) (18)

#### Authentication (2)
- AUTH_PASSWORD_RESET_REQUEST.md
- AUTH_PASSWORD_RESET_CONFIRM.md

#### Feed & Posts (3)
- FEED_FOLLOWING.md
- FEED_TRENDING.md
- SAVED_POSTS.md

#### User Profile (3)
- USER_PROFILE.md
- USER_FOLLOWERS.md
- USER_FOLLOWING.md

#### Communities (5)
- COMMUNITIES_DIRECTORY.md
- COMMUNITY_DETAIL.md
- COMMUNITY_CREATE.md
- COMMUNITY_EDIT.md
- COMMUNITY_MODERATION.md

#### Messaging (2)
- MESSAGES_LIST.md
- CONVERSATION_DETAIL.md

#### Other (2)
- NOTIFICATIONS_CENTER.md
- SEARCH.md

## 🏗️ Architecture Pattern

All components follow this pattern:

```
ComponentController (Smart)
├─ React Query for server state
├─ Zustand for auth/UI state
├─ Business logic & side effects
└─ Props → Pure presentational children
    │
    ├─ Child1 (Dumb)
    │  ├─ Props in, events out
    │  ├─ Tailwind styling
    │  ├─ Intlayer i18n
    │  └─ RTL support
    │
    └─ Child2 (Dumb)
```

**Rules:**
- Controllers use hooks, children don't
- Controllers never pass hooks/stores to children
- Children emit abstract events (not API calls)
- All text is translatable (EN/AR)
- All layouts support RTL

## 📝 Specification Structure

Each spec includes:

1. **Tech Stack Integration** - Which libraries are used
2. **Testing Requirements** - Test scenarios
3. **Component Tree** - Smart/dumb hierarchy
4. **Responsibilities Table** - What each component does
5. **Props & Events** - Interface contracts
6. **Data Flow** - React Query setup, mutations, optimistic updates
7. **State Machine** - Loading/error/success states
8. **Styling & RTL** - Tailwind patterns
9. **i18n Keys** - Complete translations (EN/AR)
10. **Implementation Examples** - Code samples

## 🎨 Key Patterns

### React Query Pattern
```javascript
// Infinite scroll
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['feed', 'home'],
  queryFn: ({ pageParam = 1 }) => fetchFeed(pageParam),
  getNextPageParam: (lastPage) => lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined
})

// Optimistic mutation
const mutation = useMutation({
  mutationFn: likePost,
  onMutate: async () => { /* snapshot & update */ },
  onError: (err, vars, context) => { /* rollback */ },
  onSettled: () => { /* invalidate */ }
})
```

### Form Pattern
```javascript
const { register, handleSubmit, formState: { errors }, setError } = useForm()

// Map server errors
if (error?.fields) {
  Object.entries(error.fields).forEach(([field, message]) => {
    setError(field, { type: 'server', message })
  })
}
```

### i18n Pattern
```typescript
// component.content.ts
export default {
  key: 'component',
  content: {
    title: t({ en: 'Title', ar: 'العنوان' })
  }
}

// Component
const { title } = useIntlayer('component')
```

### RTL Pattern
```jsx
<div className="ltr:ml-4 rtl:mr-4">
<div className="ltr:text-left rtl:text-right">
```

## 🧪 Testing Strategy

### Unit Tests (Pure Components)
- Test with various props
- Test event emissions
- Test error/loading states

### Integration Tests (Controllers)
- Mock React Query & API
- Test full user flows
- Test error handling
- Test optimistic updates

## 📚 Reference Documents

- [COMPLETE_SUMMARY.md](./COMPLETE_SUMMARY.md) - Full overview and deliverables
- [TECH_STACK_GUIDE.md](./TECH_STACK_GUIDE.md) - All implementation patterns
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Component tracking
- [../FRONTEND-CONTRACT.md](../FRONTEND-CONTRACT.md) - API contracts
- [../User-Flows.md](../User-Flows.md) - UX flows
- [../Screen-Map.md](../Screen-Map.md) - Screen specs

## 🚀 Implementation Phases

### Phase 1: Core (Week 1)
Authentication + Home Feed
- AUTH_LOGIN ✅
- AUTH_REGISTER ✅
- FEED_HOME ✅
- POST_COMPOSER ✅
- POST_DETAIL

### Phase 2: Interaction (Week 2)
User profiles + Search
- USER_PROFILE
- FEED_FOLLOWING
- SAVED_POSTS
- SEARCH

### Phase 3: Social (Week 3)
Messaging + Notifications
- MESSAGES_LIST (WebSocket)
- CONVERSATION_DETAIL (WebSocket)
- NOTIFICATIONS_CENTER (WebSocket)
- USER_FOLLOWERS
- USER_FOLLOWING

### Phase 4: Communities (Week 4)
Community features
- COMMUNITIES_DIRECTORY
- COMMUNITY_DETAIL
- COMMUNITY_CREATE
- COMMUNITY_EDIT
- COMMUNITY_MODERATION
- FEED_TRENDING

## ✅ Quality Checklist

For each component:
- [ ] Uses React Query for server state
- [ ] Uses Zustand for auth/UI state only
- [ ] Follows smart/dumb pattern
- [ ] All text translatable (EN/AR)
- [ ] Full RTL support
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Optimistic updates (where applicable)
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Styled with Tailwind
- [ ] Uses Headless UI components
- [ ] react-hot-toast for notifications

## 💡 Best Practices

1. **Never mix concerns** - Controllers fetch, children present
2. **Never pass hooks** - Pass plain data to children
3. **Always translate** - No hardcoded English text
4. **Always support RTL** - Use Tailwind directional utilities
5. **Always handle errors** - Map to user-friendly messages
6. **Always test** - Unit + integration tests
7. **Always optimize** - Optimistic updates where UX matters
8. **Always clean up** - Revoke object URLs, cancel queries, disconnect sockets

## 🐛 Common Pitfalls

❌ **Don't:**
- Pass Zustand stores to children
- Pass React Query hooks to children
- Hardcode text (use Intlayer)
- Use fixed margins/padding (use RTL utilities)
- Forget to clean up side effects
- Auto-retry on validation errors
- Mix fetching logic in presentational components

✅ **Do:**
- Pass plain props to children
- Emit abstract events from children
- Translate all text
- Use directional utilities
- Clean up in useEffect returns
- Show user-friendly errors
- Separate smart from dumb

## 📞 Need Help?

1. Check [TECH_STACK_GUIDE.md](./TECH_STACK_GUIDE.md) for patterns
2. Reference enhanced specs (AUTH_LOGIN, FEED_HOME, POST_COMPOSER)
3. Review source of truth docs (FRONTEND-CONTRACT, User-Flows, Screen-Map)
4. All patterns are based on confirmed backend implementation

---

**Status**: Ready for development  
**Components**: 23 total, 5 fully enhanced, 18 with existing structure  
**Estimated Timeline**: 4 weeks with 2-3 developers  
**Last Updated**: December 18, 2025
