# 🚀 QuickFill Microsoft Forms - Advanced Web Application

Ứng dụng web độc lập nâng cao để tự động điền Microsoft Forms với khả năng xử lý conditional logic và multi-page forms.

## 🌟 Tính năng nâng cao

- ✅ **CORS-Free Operation** - Giải quyết hoàn toàn vấn đề cross-origin restrictions
- ✅ **Conditional Fields Detection** - Phát hiện và xử lý fields xuất hiện/ẩn theo logic
- ✅ **Multi-page Navigation** - Tự động chuyển trang và điền tiếp
- ✅ **Advanced Form Scanning** - Deep analysis form structure và dependencies  
- ✅ **Manual Script Injection** - Copy-paste script khi không thể inject tự động
- ✅ **Dynamic Field Handling** - Xử lý fields xuất hiện sau khi chọn radio buttons
- ✅ **Enhanced AI Integration** - Gemini API với context-aware prompts
- ✅ **Intelligent Rescan** - Tự động tìm và điền fields bị bỏ sót
- ✅ **Real-time Progress Tracking** - Console log chi tiết với timestamps

## 🎯 Cách sử dụng (Phiên bản nâng cao)

### Method 1: Automatic Injection (Khuyến nghị)
1. **Mở ứng dụng**: Mở file `index.html` trong trình duyệt  
2. **Nhập URL**: Paste URL Microsoft Form vào ô input
3. **Load & Auto Inject**: Click "Load Form" - script sẽ tự động inject
4. **Cấu hình**: Điều chỉnh settings (Conditional, Multi-page, AI...)
5. **Advanced Scan**: Click "Advanced Scan & Fill" để bắt đầu
6. **Monitor**: Xem real-time progress trong console

### Method 2: Manual Injection (Khi gặp CORS)
1. **Generate Script**: Click "Generate Manual Script"
2. **Copy Script**: Copy toàn bộ generated script
3. **Open Form**: Mở Microsoft Form trong tab/window mới
4. **Execute**: F12 → Console → Paste script → Enter
5. **Auto Process**: Script tự động scan và fill toàn bộ form

### Method 3: Local Server (Nâng cao)
```bash
# Python
python -m http.server 8000

# Node.js  
npx serve .

# PHP
php -S localhost:8000
```

## 🔧 Cài đặt nâng cao

### 🤖 AI Configuration  
- **Gemini API Key**: https://makersuite.google.com/app/apikey
- **Context-Aware Prompts**: AI đọc nội dung câu hỏi để response phù hợp
- **Fallback Responses**: Text mặc định khi không có API key

### 📊 Advanced Rating
- **Weighted Selection**: Ưu tiên rating cao (3-5 points)
- **Smart Distribution**: Tránh pattern detection
- **Custom Ranges**: Cấu hình khoảng điểm linh hoạt

### � Conditional Logic Handling
- **Dynamic Field Detection**: Phát hiện fields xuất hiện theo logic
- **Dependency Mapping**: Map quan hệ giữa các fields
- **Auto-Trigger Events**: Tự động trigger để hiện conditional fields
- **Smart Rescan**: Rescan sau mỗi conditional change

### 🌐 Multi-page Navigation  
- **Page Detection**: Tự động phát hiện multi-page forms
- **Progress Tracking**: Theo dõi progress qua các trang
- **Navigation Logic**: Smart navigation với retry mechanism
- **State Preservation**: Giữ nguyên settings qua các trang

### ⏱️ Natural Behavior Simulation
- **Variable Delays**: 200-800ms delays mô phỏng human
- **Click Patterns**: Realistic mouse movements
- **Typing Simulation**: Natural typing speed cho text fields
- **Focus Events**: Proper focus/blur event sequences

## 🔧 Cách hoạt động

### Script Injection
1. App tạo iframe chứa Microsoft Forms
2. Inject JavaScript vào iframe để scan/fill
3. Giao tiếp qua `postMessage` API

### Field Detection
- **Radio groups**: Group theo `name` attribute
- **Text inputs**: `input[type="text"]`, `textarea`, `email`, `number`
- **Checkboxes**: `input[type="checkbox"]`
- **Dropdowns**: `select` elements
- **Questions**: Tìm trong DOM hierarchy

### Smart Filling
- **Radio**: Random selection, avoid "other"
- **Rating**: Random trong range cài đặt
- **Text**: AI generation hoặc fallback text
- **Checkbox**: 70% chance to check
- **Dropdown**: Random valid option

## 🌐 Supported URLs

- `https://forms.office.com/*`
- `https://forms.microsoft.com/*`
- `https://*.forms.office.com/*`
- `https://forms.cloud.microsoft/*`

## 🛠️ Troubleshooting

### Form không load
- Kiểm tra URL có đúng format không
- Thử refresh trang
- Kiểm tra CORS policy của form

### Script không chạy
- Form có thể chặn script injection
- Thử disable ad blocker
- Mở Developer Tools để xem errors

### AI không hoạt động
- Kiểm tra API key
- Kiểm tra internet connection
- Kiểm tra quota Gemini API

### Không tìm thấy fields
- Form có thể load chậm, đợi thêm
- Thử quét lại sau vài giây
- Kiểm tra form có fields hợp lệ không

## 💡 Tips sử dụng hiệu quả

1. **Quét trước**: Luôn quét form trước để xem structure
2. **Cố định fields quan trọng**: Name, email, số điện thoại
3. **Sử dụng natural delay**: Tránh bị detect là bot
4. **Kiểm tra kết quả**: Xem console log để debug
5. **Test trên form đơn giản**: Đảm bảo script hoạt động

## 🔒 Bảo mật

- Script chỉ chạy trong iframe
- Không gửi dữ liệu ra ngoài
- API key lưu trong localStorage
- Source code mở để audit

## 📱 Mobile Support

- Responsive design cho mobile
- Touch-friendly interface
- Optimized cho tablet

---

**🎯 Perfect cho**: Testing, QA, Demo, Development  
**⚠️ Lưu ý**: Chỉ sử dụng cho mục đích hợp pháp và có consent