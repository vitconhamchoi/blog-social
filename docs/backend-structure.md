# Backend Structure

## Suggested folders
- `Endpoints/`
- `Hubs/`
- `Domain/`
- `Infrastructure/`
- `Services/`
- `Contracts/`
- `Data/`

## Main services
- `JwtTokenService`
- `PasswordHashService`
- `CurrentUserService`
- `FriendshipService`
- `FeedService`
- `PostService`
- `MediaService`
- `RealtimeNotifier`

## EF Core entities
- User
- RefreshToken
- Friendship
- Post
- PostMedia
- MediaFile

## Authorization policy examples
- `Authenticated`
- `CanViewUserPosts`
- `CanManageOwnPost`

## Realtime hub groups
- user-specific group: `user:{userId}`
- optional friend graph groups for feed fanout
