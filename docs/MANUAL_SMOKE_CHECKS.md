# Manual Smoke Checks

This document replaces the removed shell smoke scripts and provides a manual verification strategy for the core backend flows during the migration to FastAPI.

All checks are routed through the **API Gateway** on port **3002** (as defined in `docker-compose.yml` for public endpoints).

> [!WARNING]
> **Security Requirements**:
> - Never print, copy-paste, or commit real tokens, cookies, passwords, or secrets.
> - Redact all sensitive fields using `<redacted>` in your logs or when documenting verification runs.

---

## 1. Auth Flow
**Goal**: Verify authentication, token issuance, refresh rotation, and session invalidation via `identity-service`.

### 1.1 Login
```http
POST http://localhost:3002/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin-change-me"
}
```
**Expected Response (200 OK)**:
- Returns an `accessToken` in the JSON body.
- Sets an `HttpOnly`, `Path=/` cookie named `refresh_token` containing the refresh token.
- Sets a cookie named `csrf_token` containing a CSRF token.

---

### 1.2 Access Protected Endpoint (Me)
```http
GET http://localhost:3002/api/v1/auth/me
Authorization: Bearer <your_access_token>
```
**Expected Response (200 OK)**:
- Returns current user details: `{"id": "...", "username": "admin", "role": "admin", "isActive": true, "isSuperuser": true}`.

---

### 1.3 Token Refresh Rotation
```http
POST http://localhost:3002/api/v1/auth/refresh
Cookie: refresh_token=<your_refresh_token_cookie>
X-CSRF-Token: <your_csrf_token>
```
**Expected Response (200 OK)**:
- Rotates the `refresh_token` cookie and `csrf_token`.
- Returns a fresh `accessToken` in the JSON body.

---

### 1.4 Change Password
```http
POST http://localhost:3002/api/v1/auth/change-password
Authorization: Bearer <your_access_token>
X-CSRF-Token: <your_csrf_token>
Content-Type: application/json

{
  "oldPassword": "admin-change-me",
  "newPassword": "NewAdminPassword123!"
}
```
**Expected Response (200 OK)**:
- Returns a fresh `accessToken`.
- Sets a rotated `refresh_token` cookie.

---

### 1.5 Logout
```http
POST http://localhost:3002/api/v1/auth/logout
Cookie: refresh_token=<your_refresh_token_cookie>
X-CSRF-Token: <your_csrf_token>
```
**Expected Response (200 OK)**:
- Invalidate the refresh token family.
- Deletes `refresh_token` and `csrf_token` cookies.

---

## 2. Admin User Management
**Goal**: Verify that administrators can manage users through the Gateway / Identity service.

### 2.1 Create User
```http
POST http://localhost:3002/api/v1/admin/users
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "username": "moderator_test",
  "password": "TemporaryPassword123!",
  "role": "moderator"
}
```
**Expected Response (200 OK)**:
- Returns created user object (excluding password).

---

### 2.2 List Users
```http
GET http://localhost:3002/api/v1/admin/users
Authorization: Bearer <your_access_token>
```
**Expected Response (200 OK)**:
- Returns an array containing all registered users.

---

### 2.3 Set Temporary Password
```http
POST http://localhost:3002/api/v1/admin/users/<user_id>/set-temporary-password
Authorization: Bearer <your_access_token>
```
**Expected Response (200 OK)**:
- Returns a temporary password: `{"temporaryPassword": "..."}`.
- Invalidates any active sessions/tokens for that user.

---

### 2.4 Reset Password
```http
POST http://localhost:3002/api/v1/admin/users/<user_id>/reset-password
Authorization: Bearer <your_access_token>
```
**Expected Response (200 OK)**:
- Generates a fresh temporary password and returns it.

---

### 2.5 Delete User
```http
DELETE http://localhost:3002/api/v1/admin/users/<user_id>
Authorization: Bearer <your_access_token>
```
**Expected Response (204 No Content)**:
- User is successfully deleted.

---

## 3. Tasks Flow
**Goal**: Verify that per-user task tracking, scheduling, settings, and deletion works correctly via `tasks-service`.

### 3.1 Create Parse Task
```http
POST http://localhost:3002/api/v1/tasks/parse
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "scope": "all",
  "groupIds": [1]
}
```
**Expected Response (200 OK)**:
- Returns created task details: `{"id": 1, "status": "pending", "scope": "all", ...}`.

---

### 3.2 List Tasks
```http
GET http://localhost:3002/api/v1/tasks
Authorization: Bearer <your_access_token>
```
**Expected Response (200 OK)**:
- Returns an array of tasks.

---

### 3.3 Task Details & Audit Log
```http
GET http://localhost:3002/api/v1/tasks/1
Authorization: Bearer <your_access_token>

### And Audit Log:
GET http://localhost:3002/api/v1/tasks/1/audit-log
Authorization: Bearer <your_access_token>
```
**Expected Response (200 OK)**:
- Returns the details and transition steps of the task.

---

### 3.4 Manage Automation Settings
```http
GET http://localhost:3002/api/v1/tasks/automation/settings
Authorization: Bearer <your_access_token>

### Update settings:
POST http://localhost:3002/api/v1/tasks/automation/settings
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "isEnabled": true,
  "intervalMinutes": 60
}
```
**Expected Response (200 OK)**:
- Returns automation state configurations.

---

### 3.5 Delete Task
```http
DELETE http://localhost:3002/api/v1/tasks/1
Authorization: Bearer <your_access_token>
```
**Expected Response (204 No Content)**:
- Task is deleted successfully.

---

## 4. VK Ingestion Flow (Fake Adapter)
**Goal**: Verify E2E ingestion and Kafka message propagation.

By default in local dev, `VK_SERVICE_USE_FAKE_VK_ADAPTER` is enabled, permitting full testing without real credentials.

1. **Trigger Ingestion**:
   Execute a task creation (Section 3.1) with `{"scope": "all", "groupIds": [1]}`.
2. **Observe Ingestion Logs**:
   ```bash
   docker compose logs -f vk-service
   ```
   - Verify that log entries confirm processing of the event `parsevk.tasks.events`.
   - **Crucial Security Check**: Ensure NO tokens or credentials appear in the output. Real tokens must appear only as `<redacted>` in warnings or error logs.
3. **Observe outbox payload**:
   Verify that database outbox records and Kafka payloads do NOT contain raw secrets or tokens.
4. **Completion**:
   Query `GET http://localhost:3002/api/v1/tasks/<task_id>` repeatedly. The task status should transition from `pending` -> `processing` -> `completed`.

---

## 5. Content Reads Flow
**Goal**: Verify read-models and moderation comment management.

### 5.1 Unfiltered Read Models (Content Service)
```http
### Get Groups
GET http://localhost:3002/api/v1/content/groups
Authorization: Bearer <your_access_token>

### Get Authors
GET http://localhost:3002/api/v1/content/authors
Authorization: Bearer <your_access_token>

### Get Comments
GET http://localhost:3002/api/v1/content/comments
Authorization: Bearer <your_access_token>
```
**Expected Response (200 OK)**:
- Returns list of canonical read-only structures stored in `content-db`.

---

### 5.2 Filtered Comments & Moderation (Moderation Service)
```http
### List Comments with Filters
GET http://localhost:3002/api/v1/comments?readStatus=unread&limit=10
Authorization: Bearer <your_access_token>

### Cursor-based Comment Paginated List
GET http://localhost:3002/api/v1/comments/cursor?limit=5
Authorization: Bearer <your_access_token>
```
**Expected Response (200 OK)**:
- Comments are fetched from the `moderation-service` and enriched with Author and Post bulk queries before returning to the client.

---

### 5.3 Patch Comment Read Status
```http
PATCH http://localhost:3002/api/v1/comments/1/read
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "isRead": true
}
```
**Expected Response (200 OK)**:
- Returns the updated comment moderation state with its current enrichment fields.
