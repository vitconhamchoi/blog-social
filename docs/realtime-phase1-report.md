# Realtime Phase 1 Report

## Scope
Target stack locked to:
- Backend: .NET 8
- Frontend: Angular 17

## What is implemented
### Backend
- SignalR hub `/hubs/social`
- Connection joins user-specific group using query param `userId`
- Emits realtime events:
  - `feedUpdated`
  - `friendRequestReceived`
  - `friendRequestAccepted`
  - `friendsUpdated`

### Frontend
- SignalR client connects with `userId`
- Feed page listens for `feedUpdated` and reloads feed automatically
- Friends page listens for:
  - incoming friend requests
  - accepted requests
  - friends list updates

## What can be tested now
1. Open two accounts in two browsers/incognito sessions
2. Send friend request from A to B
3. B opens Friends page: incoming request should refresh automatically
4. B accepts request
5. A and B friends list should refresh
6. A creates post
7. B feed should refresh automatically if B is online and connected

## Limitations
- This is phase-1 realtime on top of current in-memory backend state
- No authenticated SignalR bearer flow yet; current join uses userId query parameter
- No likes/comments realtime yet
- No notification center UI yet

## Next step
- Secure hub auth with real JWT
- Add realtime for likes/comments
- Add server-side persistence beyond in-memory state
