# Social Blog

Dự án blog cá nhân kiểu Facebook mini, dùng:

- Frontend: Angular 21, NgRx, RxJS, Dexie/IndexedDB, SignalR, PWA
- Backend: ASP.NET Core Minimal API, SignalR, PostgreSQL
- Auth: JWT + refresh token
- Media: lưu metadata trong PostgreSQL, file ảnh lưu local/S3-compatible tùy môi trường

## Mục tiêu chính

- Đăng ký / đăng nhập / đăng xuất
- Hồ sơ cá nhân + avatar
- Đăng trạng thái mới, đính kèm ảnh
- Kết bạn: gửi lời mời, chấp nhận, từ chối
- Chỉ bạn bè mới xem được bài đăng cá nhân
- Home feed hiển thị bài đăng của bạn bè
- Realtime notification / refresh feed bằng SignalR
- Offline-first cho một số thao tác frontend (draft, cache feed/profile)

## Cấu trúc monorepo đề xuất

- `backend/` — ASP.NET Core Minimal API + SignalR + EF Core + PostgreSQL
- `frontend/` — Angular 21 + NgRx + Dexie + SignalR + PWA
- `docs/` — kiến trúc, schema, API contract, roadmap

## Trạng thái hiện tại

Đây là bộ khung kiến trúc + thiết kế để triển khai tiếp.
