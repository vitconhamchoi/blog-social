# Frontend Structure

## Feature modules
- auth/
- profile/
- friends/
- feed/
- post-composer/
- shared/
- core/
- infrastructure/
- state/

## Suggested services
- `auth.service.ts`
- `profile.service.ts`
- `friendship.service.ts`
- `post.service.ts`
- `media.service.ts`
- `realtime.service.ts`
- `offline-queue.service.ts`
- `app-db.service.ts`

## Dexie stores
### cached_profiles
- userId
- fullName
- avatarUrl
- bio
- updatedAt

### cached_feed_posts
- postId
- authorId
- content
- createdAt
- media[]
- cachedAt

### post_drafts
- id
- content
- localImageRefs
- createdAt
- updatedAt

### offline_queue
- id
- type
- payload
- status
- createdAt

## NgRx slices
- auth
- me
- friends
- friendRequests
- feed
- profileView
- composer
- ui

## Routing
- `/login`
- `/register`
- `/`
- `/friends`
- `/u/:userId`
- `/settings/profile`
