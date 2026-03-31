# Architecture

## 1. Tech stack

### Frontend
- Angular 21 (standalone components)
- TypeScript 5.9
- NgRx store/effects
- RxJS
- Dexie (IndexedDB) cho local cache + draft/offline queue nhẹ
- SignalR client cho realtime
- Angular Service Worker (PWA)
- Angular CDK nếu cần upload UI/drag-drop media sau này

### Backend
- .NET 10
- ASP.NET Core Minimal API
- SignalR
- EF Core + Npgsql
- PostgreSQL
- JWT access token + refresh token
- Local file storage hoặc S3-compatible cho ảnh

## 2. Kiến trúc tổng quan

Dựa trên 2 dự án mẫu nhưng điều chỉnh cho social/blog:

- Frontend vẫn dùng local-first cho UX tốt:
  - cache feed, profile, friend list, friend requests
  - soạn bài offline, upload khi online (có thể hạn chế ảnh offline ở phase 1)
- Backend chuyển từ in-memory snapshot sang PostgreSQL làm nguồn dữ liệu chính thức
- SignalR dùng để phát sự kiện như:
  - `friendRequestReceived`
  - `friendRequestAccepted`
  - `feedUpdated`
  - `postCreated`
  - `profileUpdated`

## 3. Bounded modules

### Auth
- register
- login
- refresh token
- logout
- logout all sessions

### Users / Profiles
- profile cơ bản
- avatar
- public/private visibility cơ bản

### Friendships
- send request
- cancel request
- accept request
- reject request
- unfriend
- list friends
- list pending sent/received

### Posts
- create text status
- attach images
- list my posts
- list profile posts (nếu là bạn)
- home feed từ bạn bè
- soft delete post

### Media
- upload avatar
- upload post image
- validate file type / size

### Notifications / Realtime
- SignalR hub cho feed + friendship updates

## 4. Privacy rules

- User chưa đăng nhập: không xem feed cá nhân/private data
- User A chỉ xem được bài của user B nếu:
  - A == B, hoặc
  - A và B là bạn bè
- Feed trang chủ chỉ lấy bài từ bạn bè (+ có thể gồm bài của chính mình)
- Friend request không tự tạo quyền xem bài, chỉ sau khi accepted

## 5. Offline-first scope

Nên giới hạn phase 1 như sau:
- Cache local:
  - current user profile
  - friend list
  - home feed gần đây
  - post drafts
- Queue local:
  - create post text-only
  - update profile text fields
- Với upload ảnh: phase 1 nên yêu cầu online để giảm độ phức tạp

## 6. Realtime strategy

SignalR không đồng bộ full state như todo app, mà chủ yếu làm trigger/event:
- có lời mời kết bạn mới
- có người chấp nhận kết bạn
- có bài đăng mới từ bạn bè
- profile/avatar thay đổi

Frontend nhận event rồi tự gọi API pull dữ liệu mới.

## 7. Deployment

- Frontend static build + reverse proxy
- Backend ASP.NET Core
- PostgreSQL
- Media storage:
  - local disk ở dev/single node
  - S3/MinIO ở production
