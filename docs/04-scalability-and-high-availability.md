# KIẾN TRÚC CHỊU TẢI VÀ MỞ RỘNG THEO CHIỀU NGANG

## 1. Mục tiêu kiến trúc

Kiến trúc hệ thống cần đáp ứng ba yêu cầu chính:
- xử lý ổn định lưu lượng người dùng đồng thời cao
- mở rộng được bằng cách bổ sung thêm node ứng dụng
- hạn chế điểm nghẽn tập trung khi số lượng kết nối realtime và truy vấn feed tăng mạnh

## 2. Đánh giá khả năng chịu tải của kiến trúc hiện tại

Kết quả thử nghiệm hiện có cho thấy hệ thống đã đạt mốc 5.000 kết nối đồng thời qua SignalR trong môi trường kiểm thử cục bộ, với tỷ lệ kết nối thành công 100%. Điều này cho thấy nền tảng hiện tại đủ khả năng phục vụ mức tải ban đầu.

Tuy nhiên, để vận hành ổn định trong môi trường thực tế, cần xem xét thêm các yếu tố sau:
- độ trễ truy vấn cơ sở dữ liệu
- mức sử dụng CPU và bộ nhớ trên backend
- số lượng kết nối WebSocket tối đa theo từng node
- thông lượng đọc/ghi ở PostgreSQL
- hiệu năng lưu trữ ảnh và băng thông mạng

## 3. Điểm nghẽn tiềm năng trong phiên bản hiện tại

### 3.1 Backend stateful theo kết nối realtime
Mỗi node backend đang trực tiếp giữ các kết nối SignalR. Nếu triển khai nhiều node mà không có backplane, sự kiện phát ra từ node này sẽ không đến được client đang nối vào node khác.

### 3.2 Lưu file ảnh cục bộ
Khi dùng nhiều node ứng dụng, ảnh được tải lên node nào sẽ chỉ tồn tại trên node đó nếu không có shared storage. Điều này gây sai lệch dữ liệu khi cân bằng tải chuyển người dùng sang node khác.

### 3.3 Truy vấn feed còn đơn giản
Feed hiện được dựng theo danh sách bạn bè lấy trực tiếp từ cơ sở dữ liệu và tải về toàn bộ tập kết quả liên quan. Cách làm này phù hợp ở quy mô nhỏ nhưng sẽ tạo áp lực lên truy vấn khi số bài viết và số quan hệ bạn bè tăng.

### 3.4 Chưa có lớp cache phân tán
Mọi lượt đọc nghiệp vụ đều đi trực tiếp vào PostgreSQL. Khi lưu lượng tăng, cơ sở dữ liệu sẽ nhanh chóng trở thành nút thắt cổ chai.

## 4. Kiến trúc mục tiêu để scale ngang

Kiến trúc khuyến nghị cho giai đoạn production gồm các lớp sau:

1. Load Balancer / Reverse Proxy
2. Nhiều node backend stateless
3. Redis dùng cho cache phân tán và SignalR backplane
4. PostgreSQL primary-replica
5. Object storage dùng chung cho ảnh
6. Hàng đợi sự kiện hoặc message broker khi cần tách nghiệp vụ nền

## 5. Cơ chế mở rộng theo chiều ngang

### 5.1 Stateless application layer
Backend cần được giữ ở trạng thái stateless đối với nghiệp vụ HTTP, nghĩa là:
- không giữ session người dùng trong bộ nhớ tiến trình
- xác thực hoàn toàn bằng JWT
- mọi node đều có thể xử lý cùng một loại request

Khi đó, có thể tăng số lượng node backend phía sau load balancer để tăng năng lực xử lý.

### 5.2 SignalR scale-out
Để scale ngang lớp realtime, cần sử dụng backplane hoặc dịch vụ tương đương, phổ biến nhất là Redis. Khi một node phát sự kiện, các node còn lại cũng nhận được thông điệp và chuyển tiếp tới các kết nối mà chúng đang nắm giữ.

Điều này bảo đảm rằng:
- người dùng kết nối vào bất kỳ node nào cũng nhận được sự kiện đúng
- không cần sticky session cứng cho mọi tình huống
- hệ thống có thể tăng số node realtime mà vẫn giữ được tính nhất quán phân phối sự kiện

### 5.3 Shared media storage
Ảnh tải lên cần được chuyển sang object storage như S3 hoặc MinIO. Backend chỉ lưu metadata và khóa đối tượng trong cơ sở dữ liệu. Cách làm này cho phép:
- nhiều node ứng dụng cùng truy cập chung một nguồn ảnh
- mở rộng compute độc lập với storage
- tích hợp CDN để giảm tải băng thông cho backend

### 5.4 Database scaling
Cơ sở dữ liệu nên được tổ chức theo mô hình primary-replica:
- primary phục vụ ghi
- replica phục vụ các truy vấn đọc nặng như feed, profile, danh sách bạn bè

Song song với đó, cần bổ sung:
- connection pooling
- chỉ mục phù hợp
- phân tích execution plan cho các truy vấn quan trọng
- cơ chế phân trang theo cursor

### 5.5 Distributed cache
Redis nên được dùng cho các lớp dữ liệu có tần suất truy cập cao và có thể chấp nhận độ trễ đồng bộ ngắn, ví dụ:
- profile public
- danh sách bạn bè
- feed page đầu tiên
- bộ đếm like/comment

Cache giúp giảm tải cho PostgreSQL và cải thiện thời gian phản hồi.

## 6. Chiến lược feed để chịu tải cao

## 6.1 Mô hình hiện tại
Feed hiện được dựng theo truy vấn pull từ danh sách bạn bè. Đây là mô hình phù hợp cho giai đoạn đầu vì đơn giản và ít rủi ro nghiệp vụ.

## 6.2 Hướng tối ưu
Khi số lượng người dùng tăng mạnh, có thể xem xét hai hướng:

### a. Fanout on read
- Ghi bài viết một lần
- Khi người dùng mở feed, hệ thống tổng hợp bài từ các tác giả liên quan
- Dễ triển khai nhưng áp lực đọc cao

### b. Fanout on write có chọn lọc
- Khi người dùng đăng bài, hệ thống đẩy bản ghi feed vào inbox của người theo dõi/bạn bè
- Tăng chi phí ghi nhưng giảm tải đọc
- Phù hợp với tài khoản có mạng quan hệ vừa phải

Khuyến nghị thực tế là áp dụng mô hình lai:
- fanout on write cho phần lớn người dùng thông thường
- fanout on read cho tài khoản rất lớn hoặc các nguồn nội dung đặc biệt

## 7. Tính sẵn sàng cao

### 7.1 Ứng dụng
Triển khai tối thiểu 2 node backend sau load balancer để tránh điểm lỗi đơn.

### 7.2 Dữ liệu
Thiết lập sao lưu định kỳ cho PostgreSQL và object storage. Đối với PostgreSQL, cần có replica nóng và quy trình failover rõ ràng.

### 7.3 Quan sát hệ thống
Cần bổ sung lớp quan sát gồm:
- log tập trung
- metrics về API latency, error rate, WebSocket connections, DB pool usage
- tracing cho các luồng nghiệp vụ quan trọng

## 8. Lộ trình nâng cấp khuyến nghị

### Giai đoạn 1
- Chuẩn hóa tài liệu kiến trúc
- Bổ sung metrics và logging
- Tối ưu index PostgreSQL
- Tách media storage khỏi local disk

### Giai đoạn 2
- Thêm Redis cache
- Thêm SignalR backplane
- Triển khai nhiều backend node
- Bổ sung cursor pagination cho feed và comments

### Giai đoạn 3
- Tách media service hoặc notification service nếu tải tăng mạnh
- Xây dựng feed pipeline tối ưu hơn
- Thêm CDN và background jobs cho xử lý ảnh

## 9. Kết luận

Kiến trúc hiện tại của hệ thống Social Blog phù hợp với giai đoạn phát triển ban đầu và đã chứng minh được khả năng xử lý 5.000 kết nối đồng thời trong bài kiểm thử realtime. Để tiến tới môi trường production chịu tải cao và mở rộng ngang ổn định, hệ thống cần chuyển sang mô hình stateless ở lớp ứng dụng, dùng shared storage cho media, cache phân tán cho dữ liệu đọc nhiều, backplane cho realtime và tổ chức cơ sở dữ liệu theo hướng tối ưu đọc/ghi. Đây là lộ trình nâng cấp khả thi, ít rủi ro và phù hợp với trạng thái hiện tại của mã nguồn.
