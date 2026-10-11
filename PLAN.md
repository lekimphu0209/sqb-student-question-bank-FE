# KẾ HOẠCH BTL – Social Network for Student-Generated Question Bank (SQB)

> Phạm vi: **không viết backend**. Nhóm xây dựng (1) **Web Frontend** gọi backend thật tại `https://snsqb.duckdns.org/api/v1` và (2) **bộ test script** kiểm tra tính đúng đắn/hợp lý/thoả mãn yêu cầu của backend.
> Tiêu chí chấm: **độ bao phủ test script** + **UI/UX bản Web**.
> Nguồn tham chiếu: `spec_text.txt` (slide yêu cầu), `api-docs.json` / `api-summary.txt` (OpenAPI backend thực tế).

---

## 1. Mục tiêu & sản phẩm đầu ra (Deliverables)

| # | Sản phẩm | Mô tả | Tiêu chí hoàn thành |
|---|---|---|---|
| D1 | **Web App** (`/web`) | SPA React gọi backend thật, phủ các luồng Must-have + Should-have, một phần Could-have | Chạy được trên Chrome, responsive ≥1024px, có loading/error/empty state, validate client, cache feed, infinite scroll |
| D2 | **API Test Suite** (`/tests/api`) | Test tự động cho ~150 operation, theo ma trận coverage | ≥ 90% endpoint có ≥1 test; mọi rule nghiệp vụ trong slide có test; chạy 1 lệnh ra report HTML |
| D3 | **E2E Test Suite** (`/tests/e2e`) | Playwright chạy trên Web App, kiểm tra business flow end-to-end | ≥ 15 flow chính; chạy headless CI |
| D4 | **Coverage Matrix** (`/docs/coverage-matrix.xlsx` hoặc `.md`) | Bảng: Endpoint × Test case × Rule slide × Kết quả (PASS/FAIL/BACKEND-DEVIATION) | Trình bày khi bảo vệ |
| D5 | **Báo cáo lệch spec** (`/docs/backend-findings.md`) | Danh sách backend sai/khác slide, bug tìm được, kèm bằng chứng (request/response) | Mỗi finding có ID, mức độ, cách tái hiện |
| D6 | **Tài liệu UI/UX** (`/docs/ui-ux.md`) | Design system (màu hex tập trung, typography), wireframe/sitemap, flow diagram | Khớp với app thực tế |
| D7 | **Slide bảo vệ + demo script** | Kịch bản demo 10–15 phút | Có kịch bản dự phòng khi backend lỗi (mock) |

---

## 2. Công nghệ đề xuất (phù hợp hiện trạng backend)

### 2.1 Frontend Web
| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Framework | **React 18 + TypeScript + Vite** | Backend hiện tại đã có FE React/Vite ("Học viện SQB") → tương thích tư duy; build nhanh |
| Styling | **TailwindCSS + shadcn/ui** | UI hiện đại nhanh; màu định nghĩa hex tập trung trong `tailwind.config.ts` / `src/theme/colors.ts` (đáp ứng yêu cầu phi chức năng) |
| Icons | lucide-react | |
| Routing | react-router-dom v6 | |
| Server state / cache | **TanStack Query v5** | Cache trang chủ, `useInfiniteQuery` cho cursor `after/limit`, pull-to-refresh, optimistic update like/comment |
| Client state | Zustand (persist) | Auth token, theme, device_id |
| HTTP | Axios + interceptor | Gắn Bearer, auto refresh token (`/auth/refresh`), chuẩn hoá envelope `{code,message,data}`, phát hiện response sai định dạng → "lỗi kết nối" |
| Form/validate | react-hook-form + zod | Regex email trường, mật khẩu không ký tự đặc biệt, ≤500 từ, ≤4 ảnh, ≤4MB |
| Realtime | `@stomp/stompjs` (+ sockjs-client fallback) | Chat 1-1, typing, read receipt theo spec STOMP |
| Upload | `POST /medias/presign` → PUT R2 → `POST /medias/verify` (fallback `/medias/upload`) | Theo backend thực tế |
| Push | Firebase JS SDK (FID) – optional | `POST /devices/fid` |
| Charts | recharts | Thống kê câu hỏi, leaderboard |
| i18n | Tiếng Việt cứng, message lỗi tập trung `src/i18n/messages.ts` | Thống nhất thông báo lỗi |

### 2.2 Test
| Loại | Công cụ | Lý do |
|---|---|---|
| API test | **Playwright Test (APIRequestContext) + TypeScript** | Dùng chung ngôn ngữ/schema với FE; assert schema bằng **zod** sinh từ OpenAPI (`openapi-zod-client` hoặc `openapi-typescript`); report HTML; chạy song song; dễ data-setup theo role |
| Bổ sung | **Postman Collection + Newman** (export từ `api-docs.json`) | Để GV/giám khảo chạy nhanh, trực quan khi bảo vệ |
| WebSocket test | Playwright + `@stomp/stompjs` trong Node | Test send/read/typing |
| E2E UI | **Playwright** (chromium) | Flow thực trên Web App |
| Coverage tool | Script Node đọc `api-docs.json` + tag `@endpoint:GET /posts/{id}` trong tên test → sinh `coverage-matrix.md` tự động | Chứng minh bao phủ khi bảo vệ |
| Perf/smoke | k6 (optional) | Feed, search |
| CI | GitHub Actions: lint → unit → api-test (nightly) → e2e | |

### 2.3 Repo structure (monorepo pnpm)
```
sqb-btl/
├─ web/                 # React app
├─ tests/
│  ├─ api/              # Playwright API tests
│  ├─ e2e/              # Playwright UI tests
│  ├─ fixtures/         # accounts, seed helpers, sample images
│  └─ tools/            # coverage-matrix generator, openapi->zod
├─ postman/             # collection + env
├─ docs/
└─ .github/workflows/
```

---

## 3. Actor, tài khoản test & dữ liệu

| Actor | Vai trò | Cần tối thiểu |
|---|---|---|
| ADMIN | tạo học kỳ, môn, lớp, tài khoản, badge | 1 tài khoản (xin GV/backend team) |
| LECTURER | duyệt câu hỏi, tạo đề, lecturer-notes, video post, Game 5 | 2 tài khoản (GV1 chủ lớp, GV2 không liên quan để test quyền) |
| STUDENT | toàn bộ luồng social + propose + minigame | ≥ 4 tài khoản: SV_A (chính), SV_B (bạn), SV_C (người lạ), SV_D (bị chặn) |

Dữ liệu seed cần chuẩn bị bằng script `tests/fixtures/seed.ts`: 1 học kỳ active, 2 môn học, 1 lớp học phần có SV_A..D, ảnh mẫu (1KB, 3.9MB, 4.1MB, gif), file text 500/501 từ.

---

## 4. Business Flow chi tiết (dùng chung cho UI/UX và Test)

Mỗi flow: **Màn hình** → **API gọi** → **Rule cần kiểm tra** → **Test case chính**.

### BF-01 Đăng nhập / Phiên
- Màn: `/login` (1 tài khoản duy nhất, không lưu nhiều account), modal "Đăng nhập trên thiết bị khác".
- API: `POST /auth/login {email,password,deviceId,platform:WEB}` → `POST /auth/refresh` → `POST /auth/logout` → `POST /auth/change-password` → `GET /devices`, `POST /devices/{id}/logout`.
- Rule: email đúng domain trường; password không ký tự đặc biệt (validate client **trước** khi check mạng); 401/`TOKEN_INVALID_OR_EXPIRED` → auto refresh → fail thì về login; refresh trả RT **mới khác RT cũ**; sau logout RT cũ không dùng được.
- Test: TC-AUTH-01..15 (đúng/sai mật khẩu, thiếu `platform`, email sai format, account chưa verify → 403 `USER_NOT_VERIFIED`, refresh rotation, reuse RT cũ, change-password rồi login lại bằng pass cũ phải fail, logout thiết bị khác).

### BF-02 Hồ sơ cá nhân
- Màn: `/me`, `/users/:id`, modal sửa profile, upload avatar/cover.
- API: `GET/PUT /users/me`, `GET /users/{id}`, `GET /users/{id}/relationship-stats`, `/badges/me`, `/users/{id}/posts`, `/users/{id}/sessions`.
- Rule: PUT phải có ≥1 trường; `DELETE /users/me` **không được phép** theo slide (kỳ vọng backend chặn hoặc FE không expose – ghi finding); profile người bị chặn/chặn mình → không xem được.
- Test: TC-USER-01..10.

### BF-03 Bài viết (Post)
- Màn: Composer (counter từ, preview ≤4 ảnh, crop center), Post detail, Edit, Delete → quay về feed/profile theo kịch bản FB, nút "Xem thêm" (mở rộng không thu gọn).
- API: `POST /medias/presign` → upload → `POST /medias/verify` → `POST /posts {content, mediaUrls[], visibility, postType}` → `GET/PUT/DELETE /posts/{id}` → `GET /posts/me`.
- Rule slide: chỉ PUBLIC, ≤500 từ, ≤4 ảnh, ≤4MB/ảnh, không gif; sửa/xoá được; `is_edited=true` sau PUT; PUT phải có content hoặc media.
- Test: TC-POST-01..20 (500 vs 501 từ, 4 vs 5 ảnh → `MEDIA_LIMIT_EXCEEDED`, 4.1MB → `FILE_SIZE_EXCEEDED`, gif bị từ chối?, visibility FRIENDS/ONLY_ME có lọc đúng với người lạ, xoá post người khác → `ACCESS_DENIED`, GET post đã xoá → `POST_NOT_FOUND`, SV gọi `lecturer-notes` → bị cấm, `LEARNING_VIDEO` cần `subjectId`).

### BF-04 Bình luận & Like
- Màn: Comment sheet (text/link/emote, 1 ảnh), reply 1 cấp, nút Like với optimistic update, hiển thị count (không list người like).
- API: `POST/GET/PUT/DELETE /comments`, `POST /react {targetType, targetId, reactionType}`.
- Rule slide: comment ≤500 từ; **chủ post không xoá comment người khác**; **chủ comment không sửa** (backend có PUT → test và ghi finding); chỉ LIKE (backend có LOVE/WOW → FE chỉ dùng LIKE, test LOVE/WOW ghi finding); toggle like 2 lần = bỏ like; không react comment (targetType không có COMMENT ✔); comment người bị chặn trả `hidden=true, content=null`.
- Test: TC-CMT-01..15, TC-REACT-01..08.

### BF-05 News Feed
- Màn: `/` Home – skeleton lần đầu, cache lần sau (hiển thị cache ngay rồi refetch), pull-to-refresh, infinite scroll, badge "N bài mới" từ `new-count`, search bar.
- API: `GET /activity-feeds?after&limit`, `GET /activity-feeds/new-count?since`.
- Rule: bài bạn bè trước (theo thời gian) → random người khác; không có bài người bị chặn; `has_next=false` khi hết; `after` không hợp lệ → lỗi hợp lý; item type POST/SUBMISSION/BADGE/COSMETIC render khác nhau.
- Test: TC-FEED-01..10 (tạo post bởi bạn và người lạ rồi so thứ tự, block rồi reload feed, paginate đến hết, `since` ms).

### BF-06 Tìm kiếm
- Màn: `/search` với tab ALL/POST/USER/QUESTION, lịch sử + trending, xoá lịch sử.
- API: `GET /search?query&type&after&limit`, `GET /search/saved`, `DELETE /search/saved/{id}`.
- Rule: hoán vị từ khoá vẫn ra ("đội bóng Nam Việt đá"); lưu lịch sử sau khi search; không hiển thị kết quả của người bị chặn.
- Test: TC-SEARCH-01..08.

### BF-07 Bạn bè / Theo dõi / Chặn / Báo cáo
- Màn: `/friends` (tabs: Bạn bè, Lời mời nhận, Đã gửi, Gợi ý), `/following`, `/settings/blocked`, modal Report trên post/comment/user/question.
- API: `/friendships/*`, `/follows/*`, `/blocks/*`, `POST /report`.
- Rule: gửi lời mời trùng → `ACTION_ALREADY_PERFORMED`; accept bởi người không phải addressee → `ACCESS_DENIED`; **block ⇒ unfriend, không chat, không xem profile, feed/comment ẩn**; unblock không giới hạn thời gian; SV follow GV 1 chiều; relationship-stats phản ánh đúng sau mỗi thao tác.
- Test: TC-FRIEND-01..12, TC-FOLLOW-01..06, TC-BLOCK-01..10 (chuỗi: friend → block → kiểm tra 5 hệ quả → unblock → kiểm tra lại), TC-REPORT-01..04.

### BF-08 Chat 1-1 (REST + STOMP)
- Màn: `/messages` list, `/messages/:id` (bubble, typing indicator, seen, reply, ảnh, thu hồi), tạo chat từ profile.
- API: `GET /conversations`, `POST /conversations/direct`, `GET /conversations/{id}/messages`, `DELETE /messages/{id} {scope}`; STOMP `/app/chat.send|read|typing`, SUB `/user/queue/messages`.
- Rule: không chat với người chặn/bị chặn; `POST direct` 2 lần trả cùng conversation; unread_count giảm sau `chat.read`; scope ME vs EVERYONE; group chat **ngoài slide** → FE không làm, test smoke và ghi finding.
- Test: TC-CHAT-01..12, TC-WS-01..06.

### BF-09 Thông báo & Cài đặt push
- Màn: `/notifications` (unread badge, read 1 / read all, điều hướng theo `target.url`), `/settings/push` (bật/tắt, 4 category, sound/vibration, thiết bị).
- API: `GET /notifications`, `POST /notifications/{id}/read`, `/read-all`, `GET/PUT /settings/push`, `/devices/fid`.
- Rule: notify khi like/comment/bạn đăng bài/lời mời/tin nhắn/đăng nhập máy khác; unread_count đúng.
- Test: TC-NOTI-01..08 (trigger từ SV_B rồi kiểm tra SV_A nhận).

### BF-10 Đề xuất câu hỏi (SV)
- Màn: `/questions/propose` (wizard: chọn môn từ `my-enrolled-subjects` → thêm N câu: nội dung, ảnh, options với `isCorrect`, giải thích, `llmGenerated` toggle, confidence slider 0–4) → kết quả có `duplicate_warnings`; `/questions/my-submissions` (list + detail + edit/delete).
- API: `GET /sessions/my-enrolled-subjects`, `POST /sessions/propose`, `GET/PUT/DELETE /sessions/my-submissions[/{id}]`.
- Rule: `questions ≥1`, `options ≥2` và có ≥1 đúng; confidence trong [0,4]; nguồn LLM/H **ẩn với GV** (GV GET session không thấy `llmGenerated`); sửa/xoá khi đã APPROVED → `QUESTION_ALREADY_REVIEWED`; nộp trùng → `DUPLICATE_QUESTION_DETECTED`/warnings.
- Test: TC-PROP-01..15.

### BF-11 Luyện tập & đánh giá câu hỏi (SV)
- Màn: `/sessions/:id/practice` (trả lời từng câu → feedback đúng/sai + giải thích), rate 0–4 sao + `isError` (Game 5) + comment, thống kê.
- API: `GET /sessions/{id}/questions`, `POST /questions/{id}/answer`, `POST /questions/{id}/rate`, `GET /questions/{id}/ratings`, `GET /questions/{id}/statistics`.
- Rule: rating ngoài [0,4] → `INVALID_PARAMETER_VALUE`; rate 2 lần → update hay `ACTION_ALREADY_PERFORMED`; `hidden_fields` (đáp án) chỉ lộ sau khi answer; tác giả không tự rate câu mình.
- Test: TC-QI-01..12.

### BF-12 Duyệt câu hỏi (GV)
- Màn: `/lecturer/review` (list pending, sort by reacts/ratings/created), detail session: chọn câu → Approve/Reject (lý do), sửa câu, **AI refine** panel (diff + hallucination audit) → apply/discard, `complete-review`.
- API: `GET /sessions/pending`, `GET /sessions/{id}`, `POST /sessions/approve|reject`, `PUT /questions/{id}`, `POST /sessions/{id}/complete-review`, `POST /questions/{id}/ai-refine|ai-apply`.
- Rule: SV gọi → `REVIEW_PERMISSION_DENIED`/`ACCESS_DENIED`; GV không phụ trách môn có duyệt được không (finding); approve sinh `points_earned` cho tác giả + post `QUESTION_APPROVED_NOTIFICATION`; AI prompt sửa ảnh → `AI_IMAGE_MODIFICATION_NOT_SUPPORTED`; AI quá nhiều → `AI_RATE_LIMIT_EXCEEDED`.
- Test: TC-REV-01..14, TC-AI-01..06.

### BF-13 Tạo & xuất đề thi (GV)
- Màn: `/lecturer/exams` (list), `/lecturer/exams/new` (form: môn, lớp, số câu, phân bố độ khó, topic weights tổng=1, shuffle, answer key) → xem đề → export PDF/Excel; `/lecturer/questions/export`.
- API: `POST /exams/generate`, `GET /exams/my-exams`, `GET /exams/{id}`, `GET /exams/{id}/export`, `GET /lecturer/questions/export`.
- Rule: topic weights ≠1 → lỗi; question_count > số câu APPROVED → xử lý hợp lý; chỉ GV; download_url tải được.
- Test: TC-EXAM-01..10.

### BF-14 Gamification
- Màn: `/games` hub: Check-in hằng ngày, Game 1 (chọn lớp, đoán số SV nộp ngày mai), Game 2 (đoán số LLM/Human được duyệt theo session), Game 4 (đoán bank-size, 1 lần), Game 6 (phiên thứ 7: chọn câu do AI tạo), lịch sử dự đoán, Leaderboard (alltime/monthly/weekly, highlight mình), Badges, Shop/Inventory/Equip.
- API: `/games/*`, `/badges/*`, `/cosmetics/*`.
- Rule: Game 4 đoán lần 2 → `ACTION_ALREADY_PERFORMED`; Game 6 ngoài giờ → không có active session; check-in 2 lần/ngày bị chặn; mua vật phẩm thiếu coin → lỗi; equip tự gỡ item cùng loại; leaderboard có `is_current_user`.
- Test: TC-GAME-01..15, TC-COS-01..06.

### BF-15 Quản trị (Admin – chỉ test, UI tối giản)
- API: `/admin/semesters`, `/admin/subjects`, `/admin/course-classes/import-excel`, `/auth/admin/*`, `/admin/badges`, `/admin/leaderboards/rebuild`.
- Rule: SV/GV gọi → `ACCESS_DENIED`; bulk-import sai format → lỗi rõ.
- Test: TC-ADMIN-01..10 (chủ yếu phân quyền + happy path để seed).

### Cross-cutting (áp dụng mọi endpoint)
- Không token → 401/`TOKEN_INVALID_OR_EXPIRED`; token hết hạn; sai HTTP method → `METHOD_NOT_ALLOWED`; thiếu tham số bắt buộc → `MISSING_REQUIRED_PARAMETER`; sai kiểu → `INVALID_PARAMETER_TYPE`; id không tồn tại → mã *_NOT_FOUND; pagination `limit=0`, `limit=1000`, `after` rác; envelope luôn `{code,message,data}`; response schema khớp OpenAPI (zod).
- Sinh tự động cho tất cả 150 operation bằng generator → đảm bảo coverage nền ≥ 90%.

---

## 5. UI/UX – Sitemap & nguyên tắc

### 5.1 Sitemap
```
/login
/ (Home feed)            /search            /notifications
/me  /users/:id          /friends  /following  /settings/blocked
/posts/:id               /posts/new  /posts/:id/edit
/messages  /messages/:id
/questions/propose  /questions/my-submissions/:id  /sessions/:id/practice
/games  /games/leaderboard  /badges  /shop  /inventory
/settings/push  /settings/devices  /settings/password
/lecturer/review  /lecturer/review/:sessionId  /lecturer/exams  /lecturer/exams/new  /lecturer/exams/:id
/lecturer/classes  /lecturer/videos
```

### 5.2 Nguyên tắc UX (map với yêu cầu phi chức năng)
- Layout 3 cột kiểu Facebook (sidebar trái điều hướng, feed giữa, phải: gợi ý bạn bè/leaderboard/chat).
- Mọi request có **skeleton/loading**; lỗi mạng hoặc envelope sai → toast "Lỗi kết nối" thống nhất; empty state có CTA.
- Validate client trước (zod) → chỉ khi hợp lệ mới gọi API; thông báo lỗi dùng chung từ `messages.ts`.
- Cache feed bằng TanStack Query persist (localStorage) – chỉ Home.
- Infinite scroll + nút "Bài viết mới" (new-count polling 30s).
- Ảnh hiển thị center-crop, lightbox giống FB; video player cho LEARNING_VIDEO.
- "Xem thêm" cho post dài; emote picker nhập `:smile:`; link auto-detect.
- Dark mode; màu chỉ ở `src/theme/colors.ts` (hex).
- Toast realtime khi có tin nhắn/thông báo mới; badge unread ở header.
- Tối ưu a11y cơ bản (focus ring, aria-label) – điểm cộng.

### 5.3 Design system
- Font Inter; spacing 4pt; radius 12px; primary `#1877F2`-like, định nghĩa hex trong 1 file.
- Component chuẩn (shadcn): Button, Input, Textarea (word counter), Dialog, Sheet, Tabs, Avatar (+frame cosmetic), Card, Skeleton, Toast, DropdownMenu, Badge.

---

## 6. Kế hoạch theo tuần (giả định còn ~8 tuần tới buổi 13 bảo vệ thử)

| Tuần | Mục tiêu | Output |
|---|---|---|
| **W1** | Khởi tạo: monorepo, CI, design system, Axios/Query/Auth, generator OpenAPI→zod, fixture tài khoản & seed, coverage tool khung | Login hoạt động; `pnpm test:api` chạy smoke 150 endpoint (auth-less 401) |
| **W2** | BF-01, BF-02, BF-03 (Post + upload), test AUTH/USER/POST | Feed hiển thị post thật; ~50 TC |
| **W3** | BF-04, BF-05, BF-06, test CMT/REACT/FEED/SEARCH | Home hoàn chỉnh có cache + infinite scroll; ~100 TC |
| **W4** | BF-07 (friend/follow/block/report), test chuỗi block; BF-09 notifications | ~140 TC; findings v1 |
| **W5** | BF-08 chat STOMP, test WS; BF-10 propose wizard | Chat 1-1 realtime; ~170 TC |
| **W6** | BF-11, BF-12 (GV review + AI), BF-13 exams | Luồng GV end-to-end; ~210 TC |
| **W7** | BF-14 gamification, BF-15 admin test, E2E Playwright 15 flow, polish UX (dark mode, animation, a11y) | Coverage matrix ≥90%; E2E xanh |
| **W8** | Freeze, regression, viết docs D4–D7, chuẩn bị demo + mock fallback, bảo vệ thử (buổi 13) | Bản release v1.0 |
| Buổi 14–16 | Fix theo góp ý, bảo vệ chính thức | |

Milestone kiểm tra: cuối W3 (demo nội bộ social core), cuối W6 (demo luồng question bank), cuối W7 (code freeze).

---

## 7. Phân chia công việc (5 thành viên)

| Thành viên | Vai trò | Phụ trách chính | Phụ |
|---|---|---|---|
| **TV1 – FE Lead** | Kiến trúc FE, design system | Khung app, Auth, Axios/Query, upload, BF-01/02/03/05, dark mode, performance | Review PR FE |
| **TV2 – FE Social & Chat** | FE | BF-04, BF-06, BF-07, BF-08 (STOMP), BF-09 | E2E cho flow social |
| **TV3 – FE Question Bank & Lecturer** | FE | BF-10, BF-11, BF-12 (AI panel), BF-13, BF-14 | E2E cho flow GV/SV |
| **TV4 – QA Lead (API Test)** | Test | Generator OpenAPI→zod, fixtures/seed, cross-cutting tests, TC AUTH/USER/POST/CMT/REACT/FEED/SEARCH/FRIEND/BLOCK, coverage tool, Postman collection | Findings doc |
| **TV5 – QA + DevOps/Docs** | Test + hạ tầng | TC CHAT/WS/NOTI/PROP/QI/REV/AI/EXAM/GAME/ADMIN, Playwright E2E, GitHub Actions, docs D4–D7, slide, demo script, mock server fallback (MSW) | Hỗ trợ FE khi rảnh |

Quy ước làm việc:
- Branch `feat/<bf-id>-<tên>`, `test/<nhóm>`; PR cần 1 review; CI xanh mới merge.
- Mỗi test đặt tên `TC-<NHÓM>-<số> [<METHOD> <path>] <mô tả>` để tool tự sinh coverage.
- Finding backend ghi ngay vào `docs/backend-findings.md` theo mẫu: ID, endpoint, kỳ vọng (slide), thực tế, mức độ (Blocker/Major/Minor/Deviation), bằng chứng.
- Daily sync 15 phút; weekly demo thứ 7.

---

## 8. Rủi ro & phương án

| Rủi ro | Ảnh hưởng | Phương án |
|---|---|---|
| Backend down/thay đổi API khi demo | Không demo được | MSW mock từ `api-docs.json` + recorded fixtures; chụp video demo dự phòng |
| Không có tài khoản ADMIN/LECTURER | Không test được luồng GV/Admin | Xin sớm tuần 1; nếu không, test phân quyền (expect 403) và dùng mock |
| Backend lệch slide nhiều | Khó quyết định "đúng" | Chuẩn: ưu tiên slide; khác biệt ghi thành Deviation có lý giải – chính là giá trị của test |
| Dữ liệu test làm bẩn server chung | Ảnh hưởng nhóm khác | Prefix nội dung `[TEST-<team>]`, cleanup sau test, hạn chế spam AI (rate limit) |
| WebSocket qua HTTPS (wss) / CORS | Chat không chạy | Dùng `wss://snsqb.duckdns.org/api/v1/ws`, fallback SockJS; proxy Vite dev |
| Minigame phụ thuộc thời gian (Game 6 thứ 7, Game 1 ngày mai) | Không test được tức thì | Test theo trạng thái (có/không active session), ghi rõ điều kiện; demo bằng dữ liệu đã có |

---

## 9. Checklist bảo vệ
- [ ] Coverage matrix: số endpoint có test / tổng; số rule slide có test / tổng.
- [ ] Report Playwright HTML + Newman HTML mới nhất.
- [ ] Danh sách findings (top 10 nổi bật, có bằng chứng).
- [ ] Demo Web: login → feed (cache) → post ảnh → like/comment → block → chat realtime → propose → GV duyệt → tạo đề → leaderboard.
- [ ] Trình bày thiết kế UI/UX (design system, màu hex tập trung, loading/error states).
- [ ] Link GitHub + phân công trong form báo cáo.
