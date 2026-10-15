# Task Alarm

PWA nhắc việc cá nhân, ưu tiên ghi nhanh, giao diện điện thoại và danh sách công việc đến hạn/quá hạn.

## Tính năng

- Tạo việc với tiêu đề và thời hạn; có các mốc nhanh 15 phút, 1 giờ và 8 giờ sáng hôm sau.
- Hiển thị việc gần đến hạn, đếm ngược, số việc quá hạn và số việc đang chờ.
- Dời việc 15 phút/1 giờ hoặc đánh dấu hoàn thành.
- Lưu trữ việc đã hoàn thành; cho phép xem lại và xóa vĩnh viễn từng việc.
- Lưu việc mới vào bộ nhớ cục bộ khi mất mạng và thử đồng bộ khi có mạng trở lại.
- Có thể bật thông báo trình duyệt và âm thanh khi ứng dụng đang mở.
- Cài đặt như PWA trên trình duyệt hỗ trợ.

> Thông báo được kiểm tra trong lúc trang ứng dụng đang mở. Trình duyệt hoặc hệ điều hành có thể tạm dừng trang chạy nền; ứng dụng này không bảo đảm nhắc khi đã đóng hoàn toàn.

## Triển khai Cloudflare Pages

1. Đưa các file trong repository lên GitHub và kết nối repository với Cloudflare Pages.
2. Tạo cơ sở dữ liệu Cloudflare D1, sau đó cấu hình binding có tên **`DB`** cho Pages Functions.
3. Chạy SQL khởi tạo bảng:

   ```sql
   CREATE TABLE IF NOT EXISTS tasks (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL,
     due_at TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'pending'
   );
   ```

4. Deploy qua Cloudflare Pages. API được cung cấp từ `functions/api/tasks.js` tại `/api/tasks`.
5. Mở website qua HTTPS, cho phép thông báo nếu muốn nhận cảnh báo của trình duyệt, và cài PWA nếu cần.

## Lưu ý

- Các thao tác tạo việc mới có thể lưu cục bộ khi offline. Xóa việc offline sẽ được đưa vào hàng đợi đồng bộ; hoàn thành và dời lịch cần kết nối mạng để đồng bộ với máy chủ.
- API hiện chưa có đăng nhập/phân quyền. Không dùng endpoint public này để lưu dữ liệu nhạy cảm hoặc dữ liệu cần tách riêng giữa nhiều người dùng.
- Giao diện tải Tailwind CSS, Lucide và font từ CDN; khi offline, các tài nguyên đã cache có thể dùng được tùy trình duyệt và trạng thái cache.
