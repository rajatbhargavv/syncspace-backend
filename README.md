# SyncSpace Backend

SyncSpace is a collaborative workspace and task management platform built with Node.js, Express, TypeScript, Mongoose (MongoDB), Socket.io, and Web Push notifications.

## Features

- **Authentication & Authorization**: JWT cookie-based session management with refresh tokens.
- **Spaces & Collaboration**: Multi-kind workspaces (`OUR_HOME`, `BUILDERS_CIRCLE`, `STUDIO`, `MY_CORNER`, `CUSTOM`), themes, join policies (`INVITE_ONLY`, `REQUEST`, `OPEN`), and invite link management.
- **Task & Subtask Management**: Priority tracking, deadlines, assignments, status progression, and full audit timeline.
- **Real-time WebSockets**: Socket.io event dispatch for updates, comments, and client visibility tracking.
- **Web Push Notifications & PWA Support**:
  - Full standards-compliant Web Push (via `web-push` and VAPID).
  - Background push notifications delivered when users are offline or away from the browser.
  - Active tab presence suppression via WebSocket visibility events to avoid redundant notifications.
  - Device reassignment and max 10 active subscriptions per user with automatic stale cleanup.
  - Optional static hosting of frontend PWA assets (`FRONTEND_DIST_PATH`) with strict caching and SPA routing fallback.

---

## Environment Variables

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `5000` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/syncspace` |
| `ACCESS_TOKEN_SECRET` | Secret key for JWT access tokens | String (min 32 chars) |
| `REFRESH_TOKEN_SECRET` | Secret key for JWT refresh tokens | String (min 32 chars) |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `VAPID_PUBLIC_KEY` | Public VAPID key for Web Push | Base64 URL-safe key |
| `VAPID_PRIVATE_KEY` | Private VAPID key for Web Push | Base64 URL-safe key |
| `VAPID_SUBJECT` | Contact URI/mailto for VAPID | `mailto:admin@syncspace.dev` |
| `FRONTEND_DIST_PATH` | Path to frontend `dist` directory for production static serving | Optional (`../syncspace-frontend/dist`) |

### Generating VAPID Keys

To generate a fresh pair of VAPID keys for Web Push:

```bash
npx web-push generate-vapid-keys
```

Copy the generated Public and Private keys into your `.env` file under `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
```bash
npm run dev
```

### 3. Production Build & Start
```bash
npm run build
npm start
```

### 4. Running Tests
Run unit tests for Web Push and URL resolution:
```bash
node --import tsx src/services/push.test.ts
```

---

## Web Push Endpoints

All push endpoints are prefixed with `/api`:

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/push/public-key` | No | Returns `{ publicKey }` (or `503` if unconfigured). |
| `POST` | `/push/subscribe` | Yes | Saves/upserts client push subscription. |
| `DELETE` | `/push/subscribe` | Yes | Removes client push subscription (idempotent). |
| `POST` | `/push/test` | Yes | Sends a test push notification (rate limited: 1 per 30s per user). |

### Push Notification Payload Format
Web push payloads sent by the server (< 2KB):
```json
{
  "notificationId": "6640abc...",
  "type": "TASK_COMMENT",
  "title": "New comment",
  "body": "Alice commented on 'Setup Auth'",
  "url": "/spaces/6640123...?task=6640456...",
  "tag": "TASK_COMMENT:6640456...",
  "unreadCount": 3,
  "icon": "/pwa-192x192.png"
}
```

---

## Testing API Endpoints

A comprehensive set of HTTP requests is available in [`test.http`](./test.http) (usable with VS Code REST Client or JetBrains HTTP Client).
