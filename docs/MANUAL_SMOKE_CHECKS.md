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

## 4. VK Ingestion Flow

**Goal**: Verify E2E ingestion, idempotency, config validation, and safe error masking.

### 4.1 Startup Configuration Fast-Fail Check
**Goal**: Verify that the service fails fast with a configuration error when the real adapter is enabled but the token is missing.

1. Configure your local `.env` with:
   ```env
   VK_SERVICE_USE_FAKE_VK_ADAPTER=false
   VK_SERVICE_VK_TOKEN=
   ```
2. Restart `vk-service`:
   ```bash
   docker compose up -d --force-recreate vk-service
   ```
3. Observe the logs:
   ```bash
   docker compose logs vk-service
   ```
4. **Expected Output**: The service must fail to start and log a clear configuration validation error containing `"VK_SERVICE_VK_TOKEN is required when VK_SERVICE_USE_FAKE_VK_ADAPTER is false"`. No secrets must appear.
5. Revert your `.env` configuration back to use the fake adapter:
   ```env
   VK_SERVICE_USE_FAKE_VK_ADAPTER=true
   ```
   And restart the service:
   ```bash
   docker compose up -d --force-recreate vk-service
   ```

---

### 4.2 Success E2E Flow (Fake Adapter)
**Goal**: Verify successful parse execution, idempotency, and canonical records propagation.

1. **Trigger Ingestion**:
   ```http
   POST http://localhost:3002/api/v1/tasks/parse
   Authorization: Bearer <your_access_token>
   Content-Type: application/json

   {
     "scope": "selected",
     "groupIds": [1],
     "postLimit": 5,
     "mode": "recent_posts"
   }
   ```
   Observe the returned task ID (`<task_id>`).

2. **Check Ingestion Progress**:
   Query the task repeatedly:
   ```http
   GET http://localhost:3002/api/v1/tasks/<task_id>
   Authorization: Bearer <your_access_token>
   ```
   **Expected Behavior**:
   - Status transitions from `pending` -> `running` -> `done`.
   - `processedItems` and `totalItems` match exactly the number of collected items.

3. **Verify Database Records & Idempotency**:
   - Verify that groups, posts, authors, and comments are populated in `vk-db`.
   - Replay/resend the same event or trigger a task check, and verify that **no duplicate rows** are created in the database and the task status remains `done`.

---

### 4.3 Runtime Failure Check
**Goal**: Verify that runtime exceptions fail the task cleanly and redact sensitive data.

1. Temporarily configure `vk-service` default group ids to be empty in `.env`:
   ```env
   VK_SERVICE_DEFAULT_GROUP_IDS=[]
   ```
   Restart the service:
   ```bash
   docker compose up -d --force-recreate vk-service
   ```

2. Trigger a task with `scope == "all"`:
   ```http
   POST http://localhost:3002/api/v1/tasks/parse
   Authorization: Bearer <your_access_token>
   Content-Type: application/json

   {
     "scope": "all"
   }
   ```

3. **Observe Failure**:
   Query the task status:
   ```http
   GET http://localhost:3002/api/v1/tasks/<task_id>
   Authorization: Bearer <your_access_token>
   ```
   **Expected Behavior**:
   - The task transitions to status `failed`.
   - The field `error` contains a sanitized message: `"No group source configured for scope=all"`.
   - Verify logs or task logs and ensure that no tokens or raw credentials appear. Any error messages that contain sensitive data must be masked with `<redacted>`.

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
