# 🚀 Hướng dẫn cài đặt QuickFill Microsoft Forms v2.0

## Các file đã sẵn sàng ✅

Extension đã hoàn chỉnh với các file:
- ✅ `manifest.json` - Chrome Extension manifest v2.0.0
- ✅ `popup.html` - Giao diện popup với 3 tabs
- ✅ `popup.js` - Logic xử lý popup và settings
- ✅ `popup.css` - Styling hiện đại
- ✅ `content.js` - Content script v2.0 (đã fix lỗi)
- ✅ `background.js` - Service worker
- ✅ `icons/` - Bộ icon đầy đủ (16, 32, 48, 128px)

## Cài đặt Extension

### Bước 1: Mở Chrome Extensions
1. Mở Chrome browser
2. Gõ `chrome://extensions/` vào address bar
3. Nhấn Enter

### Bước 2: Bật Developer Mode
1. Ở góc trên bên phải, bật toggle "Developer mode"
2. Sẽ xuất hiện thêm các button

### Bước 3: Load Extension
1. Click button "Load unpacked"
2. Chọn thư mục: `D:\DAI_NHAN\Projects\QuickFill Microsoft Forms`
3. Click "Select Folder"

### Bước 4: Kiểm tra Extension
- Extension sẽ xuất hiện trong danh sách
- Icon QF sẽ hiện trên toolbar
- Status: Enabled ✅

## Sử dụng Extension

### 1. Mở Microsoft Forms
- Truy cập bất kỳ Microsoft Forms nào
- VD: https://forms.microsoft.com/...

### 2. Cấu hình Extension
- Click icon QF trên toolbar
- Popup sẽ mở với 3 tabs:
  - **Cơ bản**: Likert scale, auto-submit
  - **Nâng cao**: API key, delays, timeouts
  - **Câu hỏi**: Special questions, radio strategies

### 3. Thiết lập cơ bản
```
Tab "Cơ bản":
- Phạm vi Likert: 4-5 (cho đánh giá tích cực)
- ✅ Ưu tiên câu trả lời tích cực
- ✅ Tránh lựa chọn "Khác"
- ✅ Tự động gửi form mới
- Số lần gửi: 0 (không giới hạn)
- Thời gian chờ: 3 giây
```

### 4. Câu trả lời cố định (Optional)
```
Tab "Câu hỏi":
- "tên" → "Nguyễn Văn A"
- "email" → "test@example.com"
- "tuổi" → "25"
```

### 5. Bắt đầu điền form
1. Click "🎯 Bắt đầu điền Form"
2. Extension sẽ tự động:
   - Tìm và điền tất cả câu hỏi
   - Submit form
   - Click "Submit another response"
   - Lặp lại process

## Tính năng nổi bật v2.0

### 🎯 Likert Scale thông minh
- Position-based selection chính xác
- Support 3, 4, 5-point scales
- Configurable range (VD: chỉ chọn 4-5 điểm)

### 🤖 Auto-Submit & Repeat
- Tự động gửi form và bắt đầu form mới
- Có thể chạy hàng giờ không cần can thiệp
- Configurable delays và limits

### ❓ Special Questions
- Keyword-based fixed answers
- Support text, radio, dropdown
- Multi-language (VI/EN)

### 🎛️ Radio Strategies
- Random, First, Middle, Positive
- Smart "Other" avoidance
- Context-aware selection

## Troubleshooting

### Extension không load được
```bash
# Kiểm tra file manifest
Get-Content "manifest.json" | ConvertFrom-Json
```

### Lỗi permission
- Đảm bảo manifest.json có đúng permissions
- Refresh extension nếu cần

### Content script không chạy
1. Mở DevTools (F12)
2. Kiểm tra Console có lỗi gì không
3. Refresh trang Microsoft Forms

### Popup không mở
1. Right-click icon extension
2. Chọn "Inspect popup"
3. Kiểm tra lỗi trong Console

## Test Extension

### Test cơ bản
1. Mở: https://forms.microsoft.com/
2. Tạo 1 form test đơn giản
3. Chạy extension và quan sát

### Test auto-repeat
1. Bật "Auto Submit Another"
2. Set "Max Submissions: 5"
3. Chạy và quan sát counter

## Files Structure
```
QuickFill Microsoft Forms/
├── manifest.json          # Extension config
├── popup.html            # Main UI
├── popup.js              # UI logic  
├── popup.css             # Styling
├── content.js            # Form automation
├── background.js         # Service worker
├── icons/
│   ├── icon16.png        # 16x16 icon
│   ├── icon32.png        # 32x32 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md             # Documentation
```

## 🎉 Extension Ready!

Extension QuickFill Microsoft Forms v2.0 đã sẵn sàng để sử dụng với:
- ✅ Fixed content.js errors
- ✅ Complete icon set  
- ✅ Full functionality
- ✅ Professional UI
- ✅ Auto-repeat capability

Happy form filling! 🚀