# SQB – Social Network for Student-Generated Question Bank (BTL IT4409)

Frontend Web + bộ test kiểm chứng backend `https://snsqb.duckdns.org/api/v1`.

## Cấu trúc
```
.
├─ sqb-frontend/        # Web app (React 18 + TypeScript + Vite + Tailwind)
├─ docs/
│  ├─ Social Network for Student-Generated Question Bank.pdf   # slide yêu cầu gốc
│  ├─ slide-requirements.txt                                   # text trích từ PDF
│  ├─ openapi.json                                             # OpenAPI backend (tải từ Swagger)
│  ├─ api-summary.txt                                          # danh sách endpoint theo nhóm
│  └─ websocket-stomp.txt                                      # đặc tả STOMP chat
├─ PLAN.md              # kế hoạch, business flow, phân công
└─ docker-compose.yml
```

## Chạy dev
```bash
cd sqb-frontend
npm install
npm run dev        # http://localhost:5173  (proxy /api -> backend)
```

## Chạy bằng Docker
```bash
docker compose up -d --build     # http://localhost:8080
```
Nginx trong container phục vụ SPA và proxy `/api/` (REST + WebSocket) sang backend.

## Lưu ý chuẩn API thực tế
- Envelope `{ code, message, data }`, thành công `code = "1000"`.
- Request/response dùng **snake_case** (khác với schema Swagger camelCase).
- Login cần `device_id` và `platform` (`WEB`).
