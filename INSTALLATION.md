# 📋 Hướng dẫn cài đặt QuickFill Microsoft Forms

## Bước 1: Chuẩn bị icons

Trước tiên, bạn cần tạo các file icon cho extension:

### Cách 1: Sử dụng emoji (Nhanh nhất)
1. Truy cập https://favicon.io/emoji-favicons/
2. Tìm emoji 🚀 (rocket) hoặc 📝 (memo)
3. Click "Download" 
4. Giải nén file zip
5. Đổi tên các file:
   - `favicon-16x16.png` → `icon16.png`
   - `favicon-32x32.png` → `icon48.png` (resize về 48x48 nếu cần)
   - `android-chrome-192x192.png` → `icon128.png` (resize về 128x128 nếu cần)
6. Copy 3 file này vào thư mục `icons/`

### Cách 2: Tạo bằng Paint/Photoshop
1. Tạo 3 file PNG với kích thước 16x16, 48x48, 128x128
2. Nền màu xanh (#667eea)
3. Chữ "QF" màu trắng ở giữa
4. Lưu với tên `icon16.png`, `icon48.png`, `icon128.png`

## Bước 2: Cài đặt Extension

### 2.1 Mở Chrome Extensions
1. Mở Chrome browser
2. Gõ trong address bar: `chrome://extensions/`
3. Hoặc Menu (3 chấm) → More tools → Extensions

### 2.2 Bật Developer Mode
1. Ở góc trên bên phải, bật toggle "Developer mode"
2. Bạn sẽ thấy xuất hiện thêm các nút mới

### 2.3 Load Extension
1. Click nút "Load unpacked"
2. Navigate đến thư mục `QuickFill Microsoft Forms`
3. Click "Select Folder"
4. Extension sẽ xuất hiện trong danh sách

### 2.4 Kiểm tra cài đặt
- Extension sẽ có icon trên thanh toolbar
- Status là "On" (màu xanh)
- Có thể click vào để mở popup

## Bước 3: Cấu hình Gemini API (Tùy chọn)

### 3.1 Tạo API Key
1. Truy cập https://makersuite.google.com/app/apikey
2. Đăng nhập Google account
3. Click "Create API Key"
4. Copy API key

### 3.2 Nhập vào Extension
1. Click icon QuickFill trên toolbar
2. Paste API key vào trường "Gemini API Key"
3. Key sẽ được tự động lưu

## Bước 4: Test Extension

### 4.1 Mở Microsoft Forms
1. Truy cập một Microsoft Form bất kỳ
2. Ví dụ: https://forms.office.com/...

### 4.2 Sử dụng Extension
1. Click icon QuickFill
2. Cấu hình các tùy chọn:
   - Khoảng điểm: 3-5
   - ✅ Tránh lựa chọn "Other"
   - ✅ Tự động quét lại
   - ✅ Form nhiều trang
3. Click "🎯 Bắt đầu điền Form"

### 4.3 Kiểm tra kết quả
- Form sẽ được điền tự động
- Radio buttons được chọn ngẫu nhiên
- Rating được chọn trong khoảng 3-5
- Text fields có nội dung (nếu có API key)

## 🔧 Troubleshooting

### Lỗi "Extensions" không tìm thấy
- Đảm bảo bạn đang dùng Chrome (không phải Edge, Firefox)
- Version Chrome phải từ 88 trở lên

### Extension không load được
- Kiểm tra thư mục có đủ file: `manifest.json`, `popup.html`, `content.js`, `background.js`
- Kiểm tra syntax JSON trong `manifest.json`
- Xem console errors trong Developer tools

### Extension load nhưng không hoạt động
- Kiểm tra permissions trong `manifest.json`
- Refresh trang Microsoft Forms
- Mở Developer Tools (F12) xem có error không

### Icon không hiển thị
- Đảm bảo có đủ 3 file icon trong thư mục `icons/`
- Tên file phải chính xác: `icon16.png`, `icon48.png`, `icon128.png`
- File phải là PNG format

### API không hoạt động
- Kiểm tra API key có đúng không
- Kiểm tra internet connection
- Kiểm tra quota Gemini API (free tier có limit)

## 📱 Sử dụng trên các OS khác nhau

### Windows
- Path thường là: `C:\Users\[Username]\Downloads\QuickFill Microsoft Forms`
- Sử dụng Chrome thông thường

### macOS  
- Path thường là: `/Users/[Username]/Downloads/QuickFill Microsoft Forms`
- Có thể cần allow extensions trong System Preferences

### Linux
- Path thường là: `/home/[username]/Downloads/QuickFill Microsoft Forms`  
- Đảm bảo Chrome/Chromium được cài đặt

## 🚀 Tip sử dụng hiệu quả

1. **Scan trước khi fill**: Dùng "Quét Form" để xem toàn bộ fields
2. **Cố định fields quan trọng**: Chọn fields không muốn random
3. **Cấu hình rating phù hợp**: Thường 3-5 điểm cho khảo sát hài lòng
4. **Sử dụng API cho text**: Câu trả lời sẽ tự nhiên hơn nhiều
5. **Test trên form đơn giản trước**: Đảm bảo extension hoạt động OK

Chúc bạn sử dụng tool hiệu quả! 🎉