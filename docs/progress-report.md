# Báo cáo tiến độ — SQB Frontend (cập nhật theo đợt implement này)

## Đã hoàn thành trong đợt này

### Nền tảng
- `src/api/types.ts`: ~40 interface mới khớp OpenAPI (chuyển camelCase schema → snake_case wire), sửa `Author.id` → `user_id`.
- `src/api/endpoints.ts`: thêm `searchApi`, `friendApi`, `followApi`, `blockApi`, `reportApi`, `notiApi`, `convApi`, `mediaApi`, `practiceApi`, `submissionApi`, `reviewApi`, `classApi`, `examApi`, `gameApi`, `badgeApi`, `deviceApi`, `pushApi`, `authApi.refresh/changePassword`.
- `src/api/client.ts`: **auto refresh token single-flight** — gặp `9998`/401 → `POST /auth/refresh` → retry request 1 lần; refresh fail → logout về `/login`. Không retry chính request `/auth/*`.
- `src/store/auth.ts`: thêm `setTokens` (refresh rotation).
- `src/lib/upload.ts`: flow `presign → PUT R2 → verify`, fallback `/medias/upload`; validate ≤4 ảnh, ≤4MB, chặn GIF/non-image trước khi upload.
- `src/lib/chatSocket.ts`: STOMP client (`@stomp/stompjs`) — `ws(s)://<host>/api/v1/ws`, header `Authorization`, subscribe `/user/queue/messages` + `/topic/conversations.{id}`, publish `/app/chat.send|read|typing`, tự unwrap envelope.
- `src/i18n/messages.ts`: thêm sessionExpired, uploadFailed, gifNotAllowed, imageOnly, saved.

### Layout & component
- `Layout.tsx` viết lại: header (search box, 🔔 badge unread poll 30s, avatar, logout) + **grid 3 cột** (sidebar trái theo role / nội dung / cột phải: widget Điểm danh + Top 5 BXH).
- `ui.tsx`: thêm `Skeleton`, `CardSkeleton`, `Tabs`, `Modal`, `Badge`.

### Trang
- `HomePage`: skeleton, **infinite scroll IntersectionObserver**, nút "N bài mới" từ `new-count` poll 30s.
- `PostComposer`: đính kèm ảnh preview + xoá, upload trước khi tạo post.
- `PostCard`: fix `author.user_id`.
- `SearchPage`: tab ALL/POST/USER/QUESTION/SESSION, lịch sử + trending, xoá lịch sử, infinite load.
- `FriendsPage`: 3 tab (bạn bè/lời mời nhận/đã gửi) + accept/decline/unfriend/block + nút nhắn tin.
- `NotificationsPage`: list infinite, đọc 1/tất cả, icon theo type, điều hướng `target.url`.
- `MessagesPage`: hội thoại + unread badge + last message.
- `ChatPage`: **chat realtime STOMP** (gửi/nhận/typing/read-receipt), `/messages/new?to=` tạo direct conversation.
- `BlockedPage`: danh sách chặn + bỏ chặn.
- `PushSettingsPage`: push on/off, từng category, âm thanh/rung, giờ yên tĩnh.
- `DevicesPage`: danh sách thiết bị + đăng xuất thiết bị khác.
- `PracticePage`: trả lời → đúng/sai + giải thích (`hidden_fields`), rate 0–4 sao + báo lỗi (Game 5).
- `GamesPage`: điểm danh, BXH (học kỳ/theo môn + my_rank), lịch sử dự đoán, huy hiệu.
- `LecturerReviewPage` + `LecturerReviewDetailPage`: pending list (lọc môn/sort), chọn nhiều câu → approve / reject(kèm lý do) → complete-review, hiển thị duplicate_warnings.
- `ExamsPage` + `ExamNewPage`: danh sách đề, export PDF/Excel + xuất ngân hàng, form tạo đề (phân bố độ khó ≤1, chọn lớp GV phụ trách).
- `ProfilePage`: `RelationActions` — kết bạn/accept/huỷ lời mời/unfriend, follow/unfollow, nhắn tin, chặn/bỏ chặn, modal báo cáo.
- `main.tsx`: +16 route, `RequireLecturer` guard cho `/lecturer/*`.
- `package.json`: thêm `@stomp/stompjs ^7`.
- `docs/ui-ux.md` (D6): design system, sitemap, mapping màn→API, nguyên tắc trạng thái.

## Độ phủ business flow (ước lượng)
- **Xong UI**: BF-01 (login + auto refresh), BF-02, BF-03 (đăng/sửa cơ bản), BF-04 (comment+like), BF-05, BF-06, BF-07, BF-08 (chat realtime), BF-09, BF-10, BF-11, BF-12 (duyệt cơ bản), BF-13, BF-14 (điểm danh/BXH/prediction history/badges), BF-15 chưa (admin chỉ test API).
- **Còn thiếu (ưu tiên tiếp theo)**: sửa/xoá post-comment trên UI, emote/link preview, group chat, kho chat ẩn, video post, AI refine panel, form minigame 1/2/4/6, import Excel admin UI, dark mode + persist feed localStorage.

## Rủi ro kỹ thuật đã lưu ý
- `sort_by` `/sessions/pending` không có enum trong OpenAPI → dùng giá trị suy đoán (REACTS/RATINGS/CREATED), backend không nhận sẽ fallback default — cần kiểm chứng bằng test.
- Wire format snake_case khác schema camelCase trong Swagger (đã note trong README) — types viết theo snake_case.
- Chat gửi tin bằng STOMP (không có REST send); nếu WS chặn → nút gửi disable + trạng thái kết nối hiển thị.

## Lệnh kiểm chứng
```bash
cd sqb-frontend
npm install      # cài @stomp/stompjs mới
npm run dev      # dev tại :5173 (proxy /api + ws -> snsqb.duckdns.org)
npm run build    # kiểm chứng TypeScript + bundle
```
