# 🚀 QuickFill Microsoft Forms - Chrome Extension (Advanced)

Chrome Extension nâng cao để tự động điền Microsoft Forms với khả năng xử lý conditional logic và multi-page forms, hoàn toàn không bị CORS restrictions.

## 🌟 Tính năng nâng cao

### ✅ Core Features
- **Advanced Form Scanning** - Deep analysis form structure với conditional field detection
- **Smart Form Filling** - Intelligent filling với weighted rating selection
- **Conditional Logic Support** - Xử lý fields xuất hiện/ẩn theo logic
- **Multi-page Navigation** - Tự động chuyển trang và điền tiếp
- **AI Integration** - Gemini API với context-aware prompts
- **Natural Behavior** - Variable delays mô phỏng human interaction

### 🔧 Advanced Options
- **Enhanced Scanning Algorithm** - Deep DOM analysis với dependency mapping
- **Smart Retry Mechanism** - Tự động retry khi gặp lỗi
- **Conditional Field Handling** - Phát hiện và xử lý dynamic fields
- **Natural Delay System** - 200-800ms delays với pattern avoidance
- **Fixed Fields Support** - Cố định values cho specific fields
- **Intelligent Rescan** - Tự động tìm và điền fields bị bỏ sót

## 🎯 Cách sử dụng

### 1. Cài đặt Extension
1. Download source code
2. Mở Chrome → Extensions → Developer mode
3. Click "Load unpacked" → Chọn thư mục extension
4. Extension sẽ xuất hiện trong toolbar

### 2. Sử dụng trên Microsoft Forms
1. **Mở Microsoft Forms** bất kỳ
2. **Click extension icon** trên toolbar
3. **Chọn tính năng:**
   - **⚡ Quick Fill**: Scan + Fill tự động (khuyến nghị)
   - **🔍 Advanced Scan**: Phân tích chi tiết form structure
   - **🎯 Advanced Fill**: Điền với conditional logic

### 3. Cấu hình nâng cao
- **Rating Settings**: Weighted selection 3-5 points
- **AI Integration**: Gemini API cho text responses tự nhiên
- **Fixed Fields**: Cố định name, email, phone...
- **Advanced Options**: Conditional handling, enhanced scanning...

## ⚙️ Configuration Options

### 🤖 AI Settings
- **Gemini API Key**: Context-aware text generation
- **Smart Prompts**: Prompt engineering dựa trên question content
- **Fallback System**: Default responses khi AI không available

### 🔘 Form Handling
- **Avoid "Other" Options**: Skip options chứa "other", "khác"
- **Rating Range**: Smart selection 3-5 points với weighted algorithm
- **Natural Delays**: 200-800ms variable timing
- **Auto Rescan**: Tự động tìm fields mới sau khi điền

### 🔀 Advanced Features
- **Conditional Fields**: Phát hiện fields xuất hiện theo logic
- **Enhanced Scanning**: Deep DOM analysis với performance optimization
- **Smart Navigation**: Multi-page support với state preservation
- **Retry Logic**: Intelligent retry với exponential backoff

## 🔍 Advanced Scan Results

Extension sẽ hiển thị chi tiết:
- **Radio Groups**: Số lượng options, rating detection, conditional logic
- **Text Fields**: Type, required status, conditional dependencies
- **Checkboxes**: Selection probability, grouping
- **Dropdowns**: Valid options, "other" filtering
- **Multi-page Info**: Current/total pages, navigation buttons

## 🎯 Supported Form Types

### ✅ Fully Supported
- **Rating Scales** (1-5, 1-10, Likert scales)
- **Multiple Choice** (Single selection)
- **Checkboxes** (Multiple selection)
- **Text Fields** (Short/long text, email, number)
- **Dropdowns** (Select lists)

### 🔀 Advanced Support
- **Conditional Fields** (Fields xuất hiện theo logic)
- **Multi-page Forms** (Navigation giữa các trang)
- **Dynamic Forms** (Content thay đổi theo interaction)
- **Nested Questions** (Sub-questions trong groups)

## 🌐 Compatible URLs

- `https://forms.office.com/*`
- `https://forms.microsoft.com/*`
- `https://*.forms.office.com/*`
- `https://forms.cloud.microsoft/*`

## 🛠️ Technical Details

### Architecture
- **Manifest V3** - Modern Chrome Extension standard
- **Content Script Injection** - Direct DOM manipulation không bị CORS
- **Advanced DOM Selectors** - Microsoft Forms specific selectors
- **Event Simulation** - Natural click/input/change events
- **Storage Sync** - Settings đồng bộ cross-device

### Performance
- **Optimized Scanning** - Smart element detection
- **Memory Efficient** - Clean up sau mỗi operation
- **Error Handling** - Comprehensive error recovery
- **Debug Logging** - Chi tiết console logs cho troubleshooting

## 🔒 Privacy & Security

- **Local Processing** - Tất cả data xử lý local
- **No Data Collection** - Không thu thập user data
- **API Key Security** - Gemini key lưu encrypted local
- **Minimal Permissions** - Chỉ request permissions cần thiết
- **Open Source** - Code public để audit

## 🚀 Performance Tips

1. **Sử dụng Quick Fill** cho efficiency cao nhất
2. **Cấu hình Fixed Fields** cho name, email thường dùng
3. **Enable Natural Delays** để tránh detection
4. **Dùng AI cho text fields quan trọng** 
5. **Test trên simple forms trước** khi dùng complex forms

## 🐛 Troubleshooting

### Form không được điền
- Kiểm tra extension có enabled không
- Refresh trang và thử lại
- Mở Developer Tools để xem error logs

### Conditional fields không hoạt động
- Enable "Conditional Field Handling" trong settings
- Tăng delay time nếu form load chậm
- Kiểm tra console logs để debug

### AI không generate text
- Kiểm tra Gemini API key hợp lệ
- Kiểm tra internet connection
- Verify API quota chưa hết

## 📈 Development Roadmap

- [ ] **Form Templates** - Pre-configured settings cho common forms
- [ ] **Advanced Analytics** - Completion statistics và insights
- [ ] **Batch Processing** - Điền multiple forms cùng lúc
- [ ] **Custom Scripts** - User-defined filling logic
- [ ] **Cloud Sync** - Settings sync across devices

---

**🎯 Perfect cho**: Testing, QA, Demo, Development, Form automation  
**⚠️ Disclaimer**: Chỉ sử dụng cho mục đích hợp pháp với proper consent  
**📞 Support**: Open issues trên GitHub repo

## 📝 Changelog

### v1.0.0 - Advanced Release
- ✅ Complete rewrite với advanced architecture  
- ✅ Conditional field detection và handling
- ✅ Enhanced AI integration với context-aware prompts
- ✅ Smart retry mechanisms và error handling
- ✅ Natural behavior simulation với variable delays
- ✅ Comprehensive settings management
- ✅ Advanced UI với real-time feedback