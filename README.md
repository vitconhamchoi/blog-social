# Social Blog

Facebook-mini / blog cá nhân theo stack lấy cảm hứng từ 2 dự án todolist trước đó.

## Stack hiện tại

### Frontend
- Angular (standalone components)
- TypeScript
- Router + HttpClient
- UI shell cho:
  - đăng ký / đăng nhập
  - feed
  - tìm user / kết bạn / chấp nhận lời mời
  - profile cá nhân
  - tạo bài đăng status có ảnh bằng URL demo

### Backend
- ASP.NET Core Minimal API (.NET 8 local runtime)
- SignalR hub skeleton
- In-memory app state cho phase 1 demo
- Swagger

## Chức năng đang có
- Register / login / me
- Update profile / avatar URL
- Search user
- Send friend request
- Accept / reject request
- List friends
- Create post
- Feed chỉ hiện bài của mình + bạn bè
- Trang profile: chỉ thấy post nếu là chính mình hoặc đã là bạn

## Lưu ý quan trọng
- Theo yêu cầu ban đầu, production target nên dùng PostgreSQL.
- Bản code hiện tại là **phase 1 runnable skeleton**, backend đang dùng **in-memory** để ra demo nhanh.
- Tài liệu schema/API cho PostgreSQL vẫn nằm trong `docs/` để nâng cấp sang EF Core + Postgres ở phase kế tiếp.

## Chạy local

### Backend
```bash
cd backend/src/BlogSocial.Api
dotnet run
```
Backend mặc định: `http://localhost:5258`
Swagger: `http://localhost:5258/swagger`

### Frontend
```bash
cd frontend/blog-social-web
npm install
npm start
```
Frontend dev server mặc định: `http://localhost:4200`

Proxy đã cấu hình để gọi backend qua:
- `/api/*`
- `/hubs/*`

## Roadmap gần nhất
1. Chuyển backend sang EF Core + PostgreSQL
2. JWT thật + refresh token thật
3. Upload ảnh file thật thay vì URL demo
4. SignalR realtime thật cho feed/friend request
5. NgRx + Dexie offline cache đúng kiến trúc mục tiêu

## Tiến độ
Xem tiến độ thực tế tại:
- `PROGRESS.md`
- `STATUS.md`
- `TODO-NEXT.md`
