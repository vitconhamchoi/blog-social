# API Contract (v1)

## Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/auth/me`

## Profile
- GET `/api/users/me`
- PATCH `/api/users/me`
- POST `/api/users/me/avatar`
- GET `/api/users/:userId`

## Friendship
- POST `/api/friend-requests/:targetUserId`
- POST `/api/friend-requests/:requestId/accept`
- POST `/api/friend-requests/:requestId/reject`
- POST `/api/friend-requests/:requestId/cancel`
- DELETE `/api/friends/:friendUserId`
- GET `/api/friends`
- GET `/api/friend-requests/incoming`
- GET `/api/friend-requests/outgoing`

## Posts
- POST `/api/posts`
- GET `/api/posts/feed`
- GET `/api/users/:userId/posts`
- GET `/api/posts/:postId`
- DELETE `/api/posts/:postId`

## Media
- POST `/api/media/upload`
- GET `/media/:key`

## Realtime
- Hub: `/hubs/social`

Server events:
- `friendRequestReceived`
- `friendRequestAccepted`
- `feedUpdated`
- `postCreated`
- `profileUpdated`

## Notes
- Upload media có thể là 2 bước:
  1. upload file -> nhận `mediaId`
  2. create post với `mediaIds[]`
