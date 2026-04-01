# THIẾT KẾ DỮ LIỆU VÀ GIAO DIỆN DỊCH VỤ

## 1. Mô hình dữ liệu nghiệp vụ

### 1.1 Người dùng
Thực thể người dùng lưu các thuộc tính cơ bản gồm định danh, email, mật khẩu đã băm, tên hiển thị, tiểu sử, avatar và thời điểm tạo tài khoản.

### 1.2 Quan hệ bạn bè
Quan hệ bạn bè được biểu diễn qua bảng `friendships` với hai đầu mối là người gửi và người nhận, kèm trạng thái xử lý. Thiết kế này cho phép truy vết vòng đời lời mời kết bạn, thay vì chỉ lưu tập bạn bè tĩnh.

### 1.3 Bài viết
Bài viết gồm tác giả, nội dung, danh sách ảnh đính kèm và thời điểm tạo. Trong phiên bản hiện tại, danh sách ảnh được lưu dạng JSON chuỗi trong bản ghi bài viết.

### 1.4 Lượt thích
Mỗi lượt thích là một bản ghi riêng theo cặp `postId-userId`, có ràng buộc duy nhất để ngăn trùng lặp.

### 1.5 Bình luận
Bình luận hỗ trợ hai cấp: bình luận gốc và phản hồi thông qua `parentCommentId`. Thiết kế này đáp ứng được luồng thảo luận theo thread đơn giản mà không cần cây bình luận đa tầng phức tạp.

## 2. Đánh giá mô hình dữ liệu hiện tại

### 2.1 Điểm phù hợp
- Đủ đơn giản để triển khai nhanh
- Quan hệ dữ liệu rõ ràng, dễ mở rộng
- Thích hợp với EF Core và PostgreSQL
- Đảm bảo tính nhất quán cho các thao tác tương tác xã hội cơ bản

### 2.2 Hạn chế
- Ảnh bài viết đang lưu danh sách URL dưới dạng JSON trong trường dữ liệu của bài viết, chưa tách bảng media độc lập
- Chưa có cơ chế soft delete và audit cho các thực thể chính
- Chưa có bảng notification hoặc activity log riêng
- Chưa có refresh token, session management hay device tracking ở mức hoàn chỉnh

## 3. Giao diện dịch vụ hiện tại

### 3.1 Nhóm xác thực
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### 3.2 Nhóm hồ sơ người dùng
- `PATCH /api/users/me`
- `POST /api/users/me/avatar`
- `GET /api/users`
- `GET /api/users/{userId}`

### 3.3 Nhóm bạn bè
- `POST /api/friend-requests/{targetUserId}`
- `POST /api/friend-requests/{requestId}/accept`
- `POST /api/friend-requests/{requestId}/reject`
- `GET /api/friends`
- `GET /api/friend-requests/incoming`
- `GET /api/friend-requests/outgoing`

### 3.4 Nhóm bài viết và tương tác
- `POST /api/posts`
- `GET /api/posts/feed`
- `POST /api/posts/{postId}/likes/toggle`
- `POST /api/posts/{postId}/comments`
- `GET /api/posts/{postId}/comments`

### 3.5 Nhóm upload
- `POST /api/uploads/image`

### 3.6 Nhóm realtime
- `GET /hubs/social` theo giao thức SignalR/WebSocket

## 4. Nguyên tắc thiết kế API

### 4.1 REST cho ghi nhận nghiệp vụ
Mọi thay đổi trạng thái quan trọng đều được thực hiện qua API có xác thực, giúp backend kiểm soát đầy đủ validation, authorization và transaction.

### 4.2 Event cho đồng bộ giao diện
Realtime event chỉ mang ý nghĩa thông báo rằng dữ liệu đã thay đổi. Frontend sau đó chủ động gọi lại API để lấy trạng thái mới. Mô hình này phù hợp với hệ thống có nhiều loại client và tránh phụ thuộc vào payload push phức tạp.

### 4.3 Chuẩn hóa mở rộng về sau
Các nhóm API hiện tại đã đủ rõ để tách module khi cần phát triển tiếp. Trong tương lai có thể tách riêng thành:
- auth service
- social graph service
- content service
- media service
- notification service

## 5. Đề xuất cải tiến dữ liệu cho giai đoạn scale cao

### 5.1 Chuẩn hóa media
Cần tách media thành các bảng độc lập như `media_files` và `post_media` để:
- quản lý metadata file
- hỗ trợ nhiều kiểu nội dung đa phương tiện
- tối ưu truy vấn và xử lý hậu kỳ ảnh

### 5.2 Tối ưu bảng friendship
Nên chuẩn hóa cặp người dùng theo thứ tự cố định hoặc thêm ràng buộc logic để tránh tồn tại đồng thời hai bản ghi A-B và B-A ở các trạng thái không mong muốn.

### 5.3 Tối ưu truy vấn feed
Khi lượng dữ liệu tăng mạnh, cần bổ sung:
- chỉ mục theo `author_id, created_at`
- cursor pagination thay cho skip/take truyền thống
- cơ chế fanout chiến lược hoặc precomputed feed cho tập người dùng lớn
