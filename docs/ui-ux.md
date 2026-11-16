# Tài liệu UI/UX — SQB Web (D6)

> Trạng thái: khớp với code tại `sqb-frontend/` (cập nhật lần cuối theo lần triển khai này).
> Mục tiêu: mô tả design system, sitemap, luồng màn hình và cách xử lý trạng thái (loading / error / empty) theo đúng yêu cầu phi chức năng của đề.

---

## 0. Phân tích & lựa chọn bố cục

Nguồn tham khảo: Mobbin (pattern feed/chat thực tế), facebook.com (đề bài yêu cầu trải nghiệm tương tự), LinkedIn/Reddit (top-nav), shadcn-admin + Tabler (dashboard shell cho luồng giảng viên).

### Phương án A — Shell 3 cột kiểu Facebook ✅ (đã chọn, đang triển khai)
- Cấu trúc: header (logo/search/bell/avatar) + nav trái 240px + content max-w-2xl + widget phải 300px.
- Ưu: khớp định hướng "giống FB"; cột phải là chỗ tự nhiên cho gamification (điểm danh, BXH); nav chứa gọn 10+ mục theo role.
- Nhược: cần xử lý collapse tốt dưới 1280px; trang form hơi hẹp khi giới hạn cột giữa.

### Phương án B — Top-nav + 1 cột trung tâm (LinkedIn/Reddit)
- Ưu: đơn giản, responsive tự nhiên, focus đọc nội dung.
- Nhược: nav ngang không chứa nổi menu theo role; mất vị trí cố định cho widget gamification; kém "FB-like".

### Phương án C — Dashboard shell (shadcn-admin/Tabler)
- Ưu: mạnh cho nghiệp vụ GV/admin (bảng, lọc, export, thống kê).
- Nhược: tông "trang quản trị" không hợp mạng xã hội; UX nặng với sinh viên — actor chính.

### Quyết định
**A làm shell chính cho toàn app**; bên trong các trang `/lecturer/*`, cột nội dung áp **pattern của C** (filter bar, danh sách data-dense, action bar nổi khi chọn nhiều câu). Responsive: ≥1280px 3 cột · 1024–1280 bỏ cột phải · <1024 cột giữa + **bottom nav mobile** (Trang chủ/Tìm kiếm/Bạn bè/Tin nhắn/Menu).

---

## 1. Design System

### 1.1 Màu sắc (tập trung, không dùng tên màu rải rác)
Định nghĩa duy nhất tại `src/theme/colors.js` → inject vào `tailwind.config.js`. Tailwind class dùng `bg-primary`, `text-textMuted`, `border-border`… Không hard-code hex trong component.

| Token | Hex | Dùng cho |
|---|---|---|
| `primary` | `#1877F2` | nút chính, link active, like, BXH |
| `primaryHover` | `#166FE5` | hover nút chính |
| `bg` | `#F0F2F5` | nền trang, ô comment, hover |
| `surface` | `#FFFFFF` | card, header |
| `text` | `#050505` | chữ chính |
| `textMuted` | `#65676B` | chữ phụ, timestamp |
| `border` | `#CED0D4` | viền card/input |
| `danger` | `#E41E3F` | lỗi, block, reject, badge chưa đọc |
| `success` | `#31A24C` | đúng, approve, đã điểm danh |
| `like` | `#1877F2` | trạng thái đã like |

### 1.2 Typography / Spacing / Radius
- Font mặc định hệ thống (dự kiến nâng cấp Inter ở W7). Cỡ chữ: tiêu đề trang `text-xl font-bold`, tên người `font-semibold`, meta `text-xs text-textMuted`.
- Spacing theo thang Tailwind 4pt; card `p-4`, khoảng giữa card `space-y-4`; radius card `rounded-lg` (12px), input/button `rounded-md`, pill `rounded-full`.

### 1.3 Component classes dùng chung (`src/index.css`)
`.card` (surface + border + shadow-sm), `.btn` cơ sở, `.btn-primary`, `.btn-ghost`, `.input`, `.label`, `.error-text` — toàn bộ thông báo chữ nằm tập trung ở `src/i18n/messages.ts`.

### 1.4 Component React dùng chung (`src/components/ui.tsx`)
`Spinner`, `ErrorBox` (lỗi + mã code + nút thử lại), `EmptyState`, `Avatar` (fallback initials), `Skeleton`/`CardSkeleton` (loading), `Tabs`, `Modal`, `Badge`, `timeAgo`.

---

## 2. Sitemap (routes thực tế trong `src/main.tsx`)

```
/login                       ── public
/                            ── Home feed (composer + infinite scroll + nút bài mới)
/search                      ── tab ALL/POST/USER/QUESTION/SESSION + lịch sử + trending
/friends                     ── tab Bạn bè / Lời mời nhận / Đã gửi
/notifications               ── list + đọc 1/tất cả + điều hướng theo target.url
/messages                    ── danh sách hội thoại (unread badge)
/messages/:id                ── chat 1-1 realtime STOMP (+ /messages/new?to=uid tạo direct)
/posts/:id                   ── chi tiết bài + comment (reply 1 cấp, comment ẩn)
/me  /users/:userId          ── profile (RelationActions: kết bạn/follow/chặn/nhắn tin/report)
/questions/propose           ── wizard đề xuất phiên câu hỏi
/questions/my-submissions    ── phiên đề xuất của tôi
/sessions/:id/practice       ── luyện tập: trả lời → đúng/sai + giải thích → rate 0-4 + báo lỗi
/games                       ── điểm danh + BXH (học kỳ/theo môn) + lịch sử dự đoán + huy hiệu
/settings/blocked            ── danh sách chặn + bỏ chặn
/settings/push               ── bật/tắt push, 4+ category, giờ yên tĩnh, âm thanh/rung
/settings/devices            ── thiết bị đăng nhập + đăng xuất thiết bị khác
/lecturer/review             ── [GV] phiên chờ duyệt (lọc môn, sort)
/lecturer/review/:sessionId  ── [GV] chọn câu → approve/reject(lý do) → complete-review
/lecturer/exams              ── [GV] đề thi + export PDF/Excel + xuất ngân hàng
/lecturer/exams/new          ── [GV] tạo đề: môn, số câu, phân bố độ khó, lớp, shuffle, đáp án
```

`/lecturer/*` được guard bởi `RequireLecturer` (role LECTURER/ADMIN), STUDENT thấy thông báo từ chối.

---

## 3. Layout

- Header sticky: logo, ô tìm kiếm (→ `/search?query=`), icon 💬, 🔔 kèm badge số chưa đọc (poll `GET /notifications` mỗi 30s), avatar → `/me`, nút đăng xuất.
- Grid 3 cột (≥1280px): sidebar trái điều hướng (theo role), nội dung giữa `max-w-2xl`, cột phải widget Điểm danh + Top 5 BXH. 1024–1280px: ẩn cột phải. <1024px: chỉ nội dung.

---

## 4. Luồng màn hình chính → API

| Màn | API chính | Rule xử lý |
|---|---|---|
| Login | `POST /auth/login` | validate email trường + password không ký tự đặc biệt trước khi gọi; `device_id` cố định mỗi máy |
| Feed | `GET /activity-feeds`, `/new-count` | infinite scroll (IntersectionObserver), nút "N bài mới" poll 30s, skeleton lần đầu, cache TanStack Query |
| Đăng bài | presign → PUT R2 → verify → `POST /posts` | ≤500 từ, ≤4 ảnh, ≤4MB, chặn GIF — validate client trước |
| Chat | `GET /conversations/{id}/messages` + STOMP `/app/chat.send|read|typing` | subscribe `/user/queue/messages` + `/topic/conversations.{id}`; reconnect 5s; hiển thị trạng thái kết nối |
| Practice | `GET /sessions/{id}/questions`, `POST answer/rate` | đáp án chỉ lộ sau khi trả lời (`hidden_fields`); rate 0–4 + cờ báo lỗi (Game 5) |
| Duyệt câu hỏi | `GET /sessions/pending`, `GET /sessions/{id}`, approve/reject/complete-review | chọn nhiều câu, reject bắt buộc lý do, hiển thị duplicate_warnings |
| Tạo đề | `POST /exams/generate`, `GET /exams/{id}/export` | phân bố độ khó tổng ≤1, chọn lớp của GV phụ trách, mở `download_url` tab mới |
| Quan hệ | friendships/follows/blocks/relationship-stats/report | mọi thao tác invalidate `rel-stats` + profile; block → mất quyền xem/chat |

---

## 5. Trạng thái UI (yêu cầu phi chức năng)

- **Loading**: skeleton card khi tải lần đầu; `CardSkeleton` khi fetch trang tiếp theo; nút disable + nhãn "Đang..." khi mutation.
- **Error**: `ErrorBox` thống nhất hiển thị `message (mã code)`, nút Thử lại; lỗi mạng/envelope sai định dạng → "Lỗi kết nối. Vui lòng thử lại." (`CLIENT_NETWORK`/`CLIENT_BAD_FORMAT`).
- **Empty**: `EmptyState` có gợi ý hành động (VD: "Bảng tin trống. Hãy kết bạn hoặc đăng bài đầu tiên!").
- **Auth**: 401/`9998` → auto refresh 1 lần (single-flight) rồi retry; refresh fail → logout → về `/login`.

---

## 6. Chưa làm / lộ trình (cập nhật vào báo cáo tiến độ)

- Dark mode, font Inter, persist feed vào localStorage (W7).
- Emote picker `:smile:`, lightbox ảnh, sửa/xoá post & comment trên UI (API đã có).
- Group chat UI (ngoài slide), kho chat ẩn (PIN), AI refine panel cho GV, video post player.
- Minigame 1/2/4/6 form dự đoán (hiện có lịch sử + leaderboard + điểm danh).
