# QuickFill Microsoft Forms v2.0

Chrome Extension tự động điền Microsoft Forms với cấu hình linh hoạt và tùy chỉnh thông minh.

## ✨ Tính năng chính

### 🎯 Tự động điền thông minh
- **Radio buttons**: Tự động chọn các lựa chọn ngẫu nhiên, tránh các tùy chọn "Other"
- **Rating scales**: Cho phép custom khoảng điểm (ví dụ: 3-5 điểm) và random trong khoảng đó
- **Text fields**: Sử dụng Gemini AI để generate câu trả lời tự nhiên như con người
- **Checkboxes**: Random check với tỷ lệ hợp lý
- **Dropdowns**: Tự động chọn các option hợp lệ

### 🔍 Quét và phân tích form
- Quét toàn bộ form để hiển thị tất cả các trường
- Cho phép người dùng chọn các trường sẽ được cố định (không random)
- Hiển thị thống kê số lượng và loại trường

### 🔄 Tự động quét lại
- Sau khi điền xong, tự động quét lại để tìm các trường chưa được điền
- Đảm bảo không bỏ sót trường nào

### 📄 Xử lý form nhiều trang
- Tự động phát hiện và chuyển trang
- Điền từng trang một cách tuần tự
- Theo dõi tiến trình qua các trang

### 🤖 Tích hợp AI (Gemini)
- Sử dụng Gemini API để tạo câu trả lời text tự nhiên
- Đặc biệt hữu ích cho các trường text bắt buộc
- Fallback sang text đơn giản nếu AI không khả dụng

## 🛠️ Cài đặt

### Bước 1: Tải extension
1. Tải toàn bộ source code về máy
2. Mở Chrome và truy cập `chrome://extensions/`
3. Bật "Developer mode" ở góc trên bên phải
4. Click "Load unpacked" và chọn thư mục chứa extension

### Bước 2: Cấu hình Gemini API (Tùy chọn)
1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API key miễn phí
3. Mở extension và nhập API key vào trường "Gemini API Key"

## 📖 Cách sử dụng

### Sử dụng cơ bản
1. Mở Microsoft Forms cần điền
2. Click vào icon QuickFill trên thanh toolbar
3. Cấu hình các tùy chọn (nếu cần):
   - **Khoảng điểm**: Từ 3-5 điểm (hoặc tùy chỉnh)
   - **Tránh "Other"**: Bật để không chọn các tùy chọn "Other"
   - **Tự động quét lại**: Bật để quét lại sau khi điền
   - **Form nhiều trang**: Bật để xử lý form có nhiều trang
4. Click "🎯 Bắt đầu điền Form"

### Sử dụng nâng cao
1. Click "Quét Form (Phân tích)" để xem toàn bộ các trường
2. Trong phần "Cài đặt fields cố định", chọn các trường bạn muốn cố định
3. Click "🎯 Bắt đầu điền Form" để bắt đầu với cấu hình tùy chỉnh

## ⚙️ Cấu hình chi tiết

### Cài đặt Rating
- **Khoảng điểm**: Thiết lập khoảng điểm random (1-5)
- Ví dụ: Cài 3-5 sẽ random từ 3, 4, hoặc 5 điểm

### Tùy chọn điền form
- **Tránh lựa chọn "Other"**: Tự động bỏ qua các option có chữ "other", "khác", "specify"
- **Tự động quét lại**: Sau khi điền xong sẽ quét lại để tìm trường chưa điền
- **Form nhiều trang**: Tự động chuyển trang và tiếp tục điền

### Gemini AI
- Chỉ được sử dụng cho các trường text **bắt buộc**
- Tạo ra câu trả lời tự nhiên, phù hợp với ngữ cảnh
- Hỗ trợ nhiều ngôn ngữ (Việt Nam, English, etc.)

## 🔒 Bảo mật và Quyền riêng tư

- Extension chỉ hoạt động trên Microsoft Forms
- API key được lưu local trên máy bạn
- Không thu thập hay gửi dữ liệu cá nhân
- Source code mở để kiểm tra

## 🐛 Xử lý sự cố

### Extension không hoạt động
1. Kiểm tra xem có đang ở trang Microsoft Forms không
2. Refresh trang và thử lại
3. Kiểm tra console (F12) để xem có lỗi không

### Không điền được text
1. Kiểm tra API key Gemini có đúng không
2. Kiểm tra kết nối internet
3. Extension sẽ tự động fallback sang text đơn giản

### Thiếu trường
1. Sử dụng tính năng "Tự động quét lại"
2. Hoặc click "Quét Form" để xem chi tiết

## 📝 Ghi chú kỹ thuật

### Supported Form Elements
- `input[type="radio"]` - Radio buttons
- `input[type="checkbox"]` - Checkboxes  
- `input[type="text"]` - Text inputs
- `textarea` - Text areas
- `input[type="email"]` - Email inputs
- `input[type="number"]` - Number inputs
- `select` - Dropdown lists
- Rating scales (custom detection)

### AI Prompts
Extension sử dụng prompts được tối ưu hóa để tạo ra:
- Câu trả lời ngắn gọn (1-3 câu)
- Phù hợp với ngữ cảnh câu hỏi
- Tự nhiên như con người viết
- Đúng định dạng (email, số, text)

## 🚀 Roadmap

- [ ] Hỗ trợ Google Forms
- [ ] Templates cho câu trả lời thường gặp
- [ ] Batch processing nhiều form
- [ ] Export/Import cấu hình
- [ ] Advanced AI models (GPT, Claude)

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Hãy tạo issue hoặc pull request.

## 📄 License

MIT License - Sử dụng tự do cho mục đích cá nhân và thương mại.

---

**⚠️ Lưu ý**: Tool này được tạo ra để hỗ trợ việc test và development. Vui lòng sử dụng có trách nhiệm và tuân thủ các quy định của tổ chức/công ty bạn.