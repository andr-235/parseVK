# Manual Smoke Checks

This document replaces the removed shell smoke scripts and provides a manual verification strategy for the core backend flows during the migration to FastAPI.

## 1. Auth Flow
**Goal**: Verify that JWT issuance and refresh work via the new `identity-service`.

```http
### Login
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}

### Expected: 200 OK, returns accessToken and refreshToken
```

## 2. Tasks Flow
**Goal**: Verify that `tasks-service` can accept new parse tasks.

```http
### Create Task
POST http://localhost:3000/api/v1/tasks/parse
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "url": "https://vk.com/wall-123456_789"
}

### Expected: 201 Created, returns task ID
```

## 3. VK Ingestion Flow
**Goal**: Verify end-to-end VK parsing execution without leaking tokens in commits, logs, or outbox payloads.

1. **Trigger Parsing**: Run the Create Task request above.
2. **Observe Logs**: Monitor `docker logs vk-service`. Ensure no VK tokens or user passwords appear in the logs. Errors should display `<redacted>` instead of the token.
3. **Observe Kafka/Outbox**: Ensure outbox payloads do not contain `vk_token` fields.
4. **Completion**: Check `http://localhost:3000/api/v1/tasks/{taskId}` until `status` is `completed`.

## 4. Content Reads Flow
**Goal**: Verify that basic content reads route correctly to `content-service`.

```http
### Get Comments
GET http://localhost:3000/api/v1/content/comments?taskId=123
Authorization: Bearer <your_access_token>

### Expected: 200 OK, returns list of comments
```
