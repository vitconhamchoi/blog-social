# MÔ TẢ THÀNH PHẦN HỆ THỐNG

## 1. Tổng quan thành phần

Hệ thống Social Blog gồm 5 nhóm thành phần chính:
- Ứng dụng frontend
- Dịch vụ backend API
- Dịch vụ realtime
- Cơ sở dữ liệu PostgreSQL
- Khu vực lưu trữ ảnh tải lên

## 2. Frontend

Frontend được xây dựng bằng Angular, đóng vai trò giao diện người dùng và lớp điều phối tương tác với backend.

### 2.1 Chức năng chính
- Quản lý phiên đăng nhập
- Gửi yêu cầu REST tới backend
- Mở kết nối SignalR nhận sự kiện realtime
- Quản lý trạng thái giao diện bằng store
- Lưu cache feed bằng IndexedDB thông qua Dexie

### 2.2 Thành phần cốt lõi trong mã nguồn
- `api.service.ts`: lớp giao tiếp REST API
- `realtime.service.ts`: quản lý kết nối SignalR
- `feed.store.ts`: điều phối nạp feed và cache dữ liệu
- `app-db.service.ts`: định nghĩa lưu trữ cục bộ bằng Dexie
- `pages/*`: các màn hình chính như feed, login, register, friends, profile

### 2.3 Vai trò trong kiến trúc chịu tải
Frontend được thiết kế để giảm số lần tải lại không cần thiết bằng cách:
- tái sử dụng cache cục bộ cho feed
- chỉ gọi lại API khi có sự kiện cập nhật liên quan
- tách rõ tác vụ đọc dữ liệu và tác vụ nhận tín hiệu thay đổi

## 3. Backend API

Backend là thành phần trung tâm của hệ thống, đảm nhận xác thực, nghiệp vụ và truy cập dữ liệu.

### 3.1 Nhiệm vụ chính
- Xác thực và phân quyền bằng JWT
- Quản lý hồ sơ người dùng
- Quản lý quan hệ bạn bè
- Tạo và truy vấn bài viết
- Ghi nhận tương tác thích và bình luận
- Tiếp nhận yêu cầu upload ảnh
- Phát sự kiện realtime thông qua SignalR

### 3.2 Thành phần chính trong backend
- `Program.cs`: định nghĩa toàn bộ endpoint, cấu hình middleware, SignalR, CORS, JWT, static file
- `Models.cs`: mô hình thực thể và `AppDbContext`
- `JwtTokenService.cs`: phát hành access token
- `JwtOptions.cs`: cấu hình khóa và thông tin JWT

### 3.3 Đặc điểm hiện trạng
Backend đang triển khai theo kiểu monolith ứng dụng đơn, phù hợp cho giai đoạn đầu vì:
- giảm chi phí vận hành
- đơn giản hóa luồng debug
- tốc độ phát triển nhanh
- dễ kiểm soát transaction và tính nhất quán dữ liệu

## 4. Realtime Layer

### 4.1 Thành phần
SignalR Hub tại endpoint `/hubs/social` là lớp cung cấp giao tiếp thời gian thực giữa backend và frontend.

### 4.2 Cơ chế hoạt động
- Mỗi kết nối được xác thực bằng JWT
- Khi kết nối thành công, server thêm connection vào group riêng theo người dùng
- Backend gửi sự kiện tới group tương ứng khi có biến động nghiệp vụ

### 4.3 Các sự kiện hiện tại
- `friendRequestReceived`
- `friendRequestAccepted`
- `friendsUpdated`
- `feedUpdated`
- `postEngagementUpdated`

### 4.4 Vai trò trong khả năng scale
SignalR được dùng như lớp phát tín hiệu thay đổi, không phải lớp phân phối toàn bộ dữ liệu bài viết. Điều này làm giảm kích thước payload push, giảm áp lực bộ nhớ trên server và giúp scale ngang dễ hơn khi áp dụng backplane hoặc message broker.

## 5. Cơ sở dữ liệu PostgreSQL

### 5.1 Vai trò
PostgreSQL là nơi lưu trữ bền vững toàn bộ dữ liệu nghiệp vụ.

### 5.2 Nhóm bảng chính
- `users`
- `friendships`
- `posts`
- `post_likes`
- `post_comments`

### 5.3 Vai trò trong hiệu năng
PostgreSQL phù hợp với mô hình dữ liệu quan hệ của hệ thống nhờ:
- hỗ trợ transaction tốt
- index linh hoạt cho truy vấn feed và quan hệ bạn bè
- khả năng mở rộng theo chiều dọc tốt ở giai đoạn đầu
- dễ tích hợp replication và read replica khi cần mở rộng

## 6. Lưu trữ file ảnh

### 6.1 Hiện trạng
Ảnh đang được lưu vào thư mục `uploads/` trong backend và được phục vụ qua static route `/uploads/*`.

### 6.2 Đánh giá
Mô hình lưu file cục bộ phù hợp cho môi trường phát triển hoặc triển khai đơn node, nhưng không tối ưu cho scale ngang vì các node có thể không dùng chung vùng lưu trữ.

### 6.3 Định hướng nâng cấp
Khi triển khai production chịu tải cao, cần chuyển sang object storage dùng chung như S3 hoặc MinIO để:
- tách compute khỏi storage
- cho phép nhiều backend node cùng truy cập file
- giảm ràng buộc dữ liệu cục bộ trên từng máy chủ
