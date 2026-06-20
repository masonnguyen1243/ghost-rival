---
title: Product Brief — Ghost Rival
status: final
created: 2026-06-19
updated: 2026-06-19
---

# Product Brief: Ghost Rival

## Executive Summary

Ghost Rival là ứng dụng gym tracker mobile dành cho người tập một mình — những người muốn theo dõi tiến trình nhưng thấy các app hiện tại quá phức tạp, quá tốn thời gian, hoặc tốn tiền. Thay vì so sánh với người khác hay nhập số liệu thủ công mỗi set, Ghost Rival để người dùng cạnh tranh với một đối thủ duy nhất: chính họ của hôm qua.

App được thiết kế theo triết lý "vô hình" — luôn ở đó khi cần, không bao giờ làm phiền khi không cần. Ghi chú diễn ra qua một tap, thông báo xuất hiện đúng lúc, và mỗi khi người dùng phá kỷ lục cá nhân, app tôn vinh khoảnh khắc đó như một sự kiện thực sự — không phải một con số cập nhật âm thầm.

Tại sao bây giờ: người tập gym solo là phân khúc lớn nhưng bị các app fitness bỏ qua. Hầu hết app được thiết kế cho người có PT, có bạn tập, hoặc sẵn sàng trả tiền subscription. Ghost Rival lấp đúng khoảng trống đó — miễn phí, riêng tư, không cần cộng đồng.

## The Problem

Người tập gym một mình đối mặt với ba vấn đề cụ thể:

**1. Ghi chú quá bất tiện.**
Giữa các set, không ai muốn dừng tay mở app, điều hướng đến đúng bài tập, gõ số. Đặc biệt khi đang lướt điện thoại trong lúc nghỉ — ngắt quãng để log là ma sát đủ lớn để bỏ qua. Kết quả: không ghi gì cả.

**2. Không biết mình có đang tiến bộ không.**
Không có PT, không có bạn tập — không ai nói cho người dùng biết tuần này họ mạnh hơn tuần trước hay đang dậm chân tại chỗ. Thiếu dữ liệu dẫn đến thiếu động lực, thiếu động lực dẫn đến bỏ tập.

**3. Không có app miễn phí nào đủ tốt.**
Các app chất lượng (Strong, Hevy) đều tính phí hoặc đặt tính năng quan trọng sau paywall. Các app miễn phí thì cồng kềnh hoặc bị quảng cáo làm phiền.

## Who This Serves

**Primary — Solo Gym-Goer:**
Người tập gym một mình, 20-35 tuổi, dùng điện thoại trong lúc nghỉ giữa các set (lướt mạng xã hội, nhắn tin). Họ muốn track tiến trình nhưng không muốn app phức tạp hay tốn tiền. Họ biết mình muốn gì — chỉ cần công cụ không cản đường.

Thước đo thành công cho họ: nhìn lại sau 3 tháng và thấy rõ mình mạnh hơn, không còn phải đoán mình có tiến bộ không.

**Builder = người dùng đầu tiên:** Mọi quyết định thiết kế được kiểm chứng ngay tại gym — không có khoảng cách giữa người làm và người dùng.

## The Solution

Ghost Rival giải quyết bài toán bằng ba lớp:

**Lớp 1 — Log không cần cố gắng.**
Floating bubble nổi trên mọi app trong lúc nghỉ. Người dùng đang lướt mạng xã hội — bubble đếm ngược thời gian nghỉ, hết giờ rung nhẹ, tap một cái để confirm set tiếp theo. Không cần mở app, không cần rời khỏi thứ đang làm.

**Lớp 2 — Ghost Rival.**
Mỗi buổi tập, người dùng đấu với bản thân của một tuần trước, một tháng trước, hoặc đỉnh cao nhất từ trước đến nay. Khi phá kỷ lục cá nhân (PR), app ăn mừng lớn và lưu vào Hall of Fame. Ghost cũ "về hưu", Ghost mới được tạo ngay sau đó.

**Lớp 3 — Infinite Goal Engine.**
Khi người dùng đạt mục tiêu, app tự generate mục tiêu tiếp theo dựa trên tốc độ tiến bộ. Không bao giờ có "goal vacuum" — luôn có Ghost mới chờ phía trước.

**Điểm khác biệt cốt lõi:**
- Đối thủ duy nhất là chính người dùng — không leaderboard, không so sánh với người khác, không social. Hoàn toàn riêng tư.
- Vô hình theo thiết kế — app không chiếm quyền kiểm soát điện thoại.
- Miễn phí thật sự — không freemium, không tính năng bị khóa, không quảng cáo, không kế hoạch monetization.

## Success Criteria

**MVP — Tháng 1:**
- Người dùng (builder) dùng được ở gym trong một buổi tập hoàn chỉnh mà không thấy bất tiện
- Ghost Rival hiển thị đúng dữ liệu lịch sử
- PR Explosion trigger đúng khi phá kỷ lục
- Floating bubble không crash, không ăn pin bất thường

**Tháng 3:**
- Streak ít nhất 30 ngày tự dùng liên tục
- Ít nhất 3 kỷ lục cá nhân được ghi nhận đúng
- Cảm giác chủ quan: tiến bộ rõ ràng hơn so với trước khi có app

**Tín hiệu pivot:** Nếu sau 30 ngày tự dùng mà vẫn thấy log bất tiện hoặc Ghost Rival không tạo được động lực — cần xem lại cơ chế core trước khi build thêm.

## Scope

**Nền tảng:** iOS + Android, dùng React Native (solo dev).

**Ưu tiên nền tảng:** Chưa quyết định — nếu bị trượt deadline 1 tháng, ưu tiên hoàn thiện một nền tảng trước.

**Trong — Phase 1 MVP (1 tháng):**
- Ghost Rival (so sánh với bản thân quá khứ, chọn mức Ghost)
- PR Explosion (animation + Hall of Fame khi phá kỷ lục)
- One-Tap logging + Floating Bubble (overlay trên mọi app)
- Gym Streak + Mercy Days (2 ngày ân xá mỗi tháng)
- Infinite Goal Engine (auto-generate mục tiêu tiếp theo)

**Ngoài — sau MVP:**
- Apple Watch / Wear OS auto-detect workout
- Recovery Score (dựa trên resting heart rate)
- Snap & Eat (nhận diện calo qua ảnh — lưu ý: độ chính xác thấp cho món Việt Nam do thiếu dữ liệu training)
- Progress Mirror (time-lapse ảnh cơ thể)
- Ghost Composition (track mỡ và cơ riêng biệt)
- Ghost Life (mở rộng ra bước đi, giấc ngủ, nước)

## Vision

Nếu thành công ở MVP, Ghost Rival trở thành người bạn đồng hành suốt hành trình tập gym — phản chiếu toàn bộ sự tiến bộ của cơ thể, từ sức mạnh, đến body composition (mỡ và cơ), đến giấc ngủ, bước đi, và cả những ngày người dùng gần bỏ cuộc nhưng không bỏ. Mục tiêu dài hạn không phải là thêm tính năng — mà là làm cho người dùng không thể tưởng tượng tập gym mà thiếu Ghost của mình.
