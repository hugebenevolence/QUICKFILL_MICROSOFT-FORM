# 🚀 QuickFill Microsoft Forms v2.1

Chrome Extension tự động điền Microsoft Forms thông minh với trọng số Likert động và thống kê real-time.

## ✨ Tính năng nổi bật

- 🎯 **Tự động điền thông minh** - Radio, checkbox, text, rating scales
- ⚖️ **Trọng số Likert động** - Tùy chỉnh tỷ lệ xuất hiện từng điểm  
- 📊 **Thống kê real-time** - Session timer, submit counter persist khi đóng popup
- � **Chạy không giới hạn** - Đặt 0 để chạy vô hạn form
- 🤖 **Gemini AI** - Tạo text tự nhiên cho trường bắt buộc

## 🛠️ Cài đặt nhanh

1. **Tải về** → `chrome://extensions/` → Bật "Developer mode" → "Load unpacked"
2. **Gemini API** (tùy chọn) → [Google AI Studio](https://makersuite.google.com/app/apikey) → Tạo key miễn phí

## 🎯 Cách dùng

1. **Mở Microsoft Forms** → Click icon QuickFill
2. **Cấu hình Likert** → Chọn range (VD: 4-5) → Click dropdown để set trọng số
3. **Số lần gửi** → Nhập số (0 = không giới hạn)  
4. **Bắt đầu** → "🎯 Bắt đầu điền Form"
5. **Theo dõi** → Xem thống kê real-time (timer + counter)

## ⚖️ Trọng số Likert - Tính năng độc quyền

```
Range 4-5: 
├── Điểm 5: [60] → 60% 
└── Điểm 4: [40] → 40%

Range 3-5:
├── Điểm 5: [50] → 50%
├── Điểm 4: [40] → 40% 
└── Điểm 3: [10] → 10%
```

**Cách hoạt động**: Số càng lớn = xuất hiện càng nhiều. Auto-sync với range min-max!

## 🎨 Giao diện v2.1

### Tab Cơ bản
- ⭐ **Likert Scale** → Range + Dropdown trọng số với UI đẹp
- 📋 **Tùy chọn** → Ưu tiên tích cực, tránh "Khác", auto-submit  
- 🔄 **Lặp lại** → Số lần gửi (0 = ∞), delay giữa các lần

### Tab Nâng cao  
- 🤖 **Gemini API** → Key cho text tự nhiên
- ⏱️ **Timing** → Random delay, timeout settings
- � **Performance** → Max retries, question timeout

### Tab Câu hỏi
- ❓ **Fixed Answers** → Set câu trả lời cố định cho keyword
- 🎯 **Radio Strategy** → Random, first, middle, positive

## 📊 Thống kê Real-time

- **Forms đã gửi**: Counter với animation celebration
- **Thời gian chạy**: MM:SS timer persist khi đóng popup  
- **Trạng thái**: Đang chờ → Đang chạy → Hoàn thành ✅

## 🐛 Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Timer reset về 0:00 | Fixed ✅ - Session persist trong storage |
| Không submit another | Check HTML structure, có thể form không hỗ trợ |  
| Trọng số không hoạt động | Verify range min-max, check dropdown values |

## � Tech Stack

**Frontend**: HTML5, CSS3, JavaScript ES2022  
**Storage**: Chrome Storage API (sync + local)  
**AI**: Gemini API integration  
**Architecture**: Manifest v3, Content Scripts, Background Scripts

## 🚀 Changelog v2.1

- ✅ **Dynamic Likert Weights** - UI dropdown sync với range
- ✅ **Persistent Session Timer** - Không reset khi đóng popup  
- ✅ **Unlimited Submissions** - 0 = truly unlimited
- ✅ **Real-time Statistics** - Live updates với animations
- ✅ **Enhanced Debug** - Console logs để troubleshooting

## 📄 License & Disclaimer

**MIT License** - Free for personal & commercial use  
**⚠️ Disclaimer**: Tool for testing/development. Use responsibly per your organization's policies.

---
*QuickFill v2.1 - The smartest Microsoft Forms automation tool* 🚀