# Auth Session Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать продление авторизации устойчивым, чтобы пользователь не терял сессию во время активной работы при валидном refresh token.

**Architecture:** Сохраняем текущую JWT-схему и усиливаем её на фронтенде: добавляем превентивное обновление access token по таймеру, оставляем refresh-on-401 как резервный путь и меняем обработку ошибок refresh так, чтобы logout происходил только при реальной невалидности refresh token. На бэкенде проверяем и при необходимости усиливаем контракт `/auth/refresh` и тесты на ротацию токенов.

**Tech Stack:** React, TypeScript, Zustand, Vite, Vitest, NestJS, Passport JWT.

---

## Chunk 1: Зафиксировать текущее проблемное поведение тестами

### Task 1: Frontend tests for refresh error handling

**Files:**
- Modify: `front/src/modules/auth/lib/authSession.ts`
- Create: `front/src/modules/auth/lib/__tests__/authSession.test.ts`
- Test: `front/src/modules/auth/lib/__tests__/authSession.test.ts`

- [ ] **Step 1: Написать падающий тест на поведение при `401` от `/auth/refresh`**

```ts
it('clears auth when refresh endpoint returns 401', async () => {
  useAuthStore.setState({
    accessToken: 'old-access',
    refreshToken: 'valid-refresh',
    user: { id: 1, username: 'admin', role: 'admin', isTemporaryPassword: false },
  })

  global.fetch = vi.fn().mockResolvedValue(
    new Response(null, { status: 401 })
  ) as Mock

  const result = await refreshAccessToken()

  expect(result).toBeNull()
  expect(useAuthStore.getState().accessToken).toBeNull()
  expect(useAuthStore.getState().refreshToken).toBeNull()
})
```

- [ ] **Step 2: Написать падающий тест на поведение при `503` от `/auth/refresh`**

```ts
it('does not clear auth on transient refresh failure', async () => {
  useAuthStore.setState({
    accessToken: 'old-access',
    refreshToken: 'valid-refresh',
    user: { id: 1, username: 'admin', role: 'admin', isTemporaryPassword: false },
  })

  global.fetch = vi.fn().mockResolvedValue(
    new Response(null, { status: 503 })
  ) as Mock

  await refreshAccessToken()

  expect(useAuthStore.getState().refreshToken).toBe('valid-refresh')
  expect(useAuthStore.getState().user?.username).toBe('admin')
})
```

- [ ] **Step 3: Запустить тесты и убедиться, что второй тест падает**

Run: `cd front && bun test src/modules/auth/lib/__tests__/authSession.test.ts`

Expected: FAIL because current implementation calls `clearAuth()` on any non-OK refresh response.

- [ ] **Step 4: Закоммитить тестовый baseline**

```bash
git add front/src/modules/auth/lib/__tests__/authSession.test.ts
git commit -m "test: зафиксировано поведение refresh авторизации"
```

### Task 2: Backend tests for refresh rotation contract

**Files:**
- Modify: `api/src/auth/telegram-auth.service.spec.ts`
- Modify: `api/src/telegram/telegram-auth.service.spec.ts`
- Modify: `api/src/auth/auth.service.spec.ts` (if exists, otherwise create)
- Test: `api/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Найти подходящий auth spec файл и добавить падающий тест на последовательный refresh**

```ts
it('rejects an outdated refresh token after successful rotation', async () => {
  const first = await authService.login('admin', 'password')
  const second = await authService.refreshTokens(userId, first.refreshToken)

  await expect(
    authService.refreshTokens(userId, first.refreshToken)
  ).rejects.toThrow('Invalid refresh token')

  expect(second.accessToken).toBeDefined()
  expect(second.refreshToken).toBeDefined()
})
```

- [ ] **Step 2: Добавить тест на корректный refresh валидным последним токеном**

```ts
it('accepts the most recently issued refresh token', async () => {
  const first = await authService.login('admin', 'password')
  const second = await authService.refreshTokens(userId, first.refreshToken)
  const third = await authService.refreshTokens(userId, second.refreshToken)

  expect(third.accessToken).toBeDefined()
})
```

- [ ] **Step 3: Запустить только auth tests**

Run: `cd api && bun test src/auth/auth.service.spec.ts`

Expected: PASS if contract already correct, otherwise FAIL with exact rotation issue that must be fixed before frontend work depends on it.

- [ ] **Step 4: Закоммитить тесты auth-контракта**

```bash
git add api/src/auth/auth.service.spec.ts
git commit -m "test: добавлены проверки ротации refresh токена"
```

## Chunk 2: Усилить refresh handling на фронтенде

### Task 3: Сделать `refreshAccessToken()` устойчивым к временным ошибкам

**Files:**
- Modify: `front/src/modules/auth/lib/authSession.ts`
- Test: `front/src/modules/auth/lib/__tests__/authSession.test.ts`

- [ ] **Step 1: Реализовать различение фатальных и временных ошибок refresh**

```ts
const isFatalRefreshStatus = (status: number) => status === 401 || status === 403

if (!response.ok) {
  if (isFatalRefreshStatus(response.status)) {
    clearAuth()
  }
  return null
}
```

- [ ] **Step 2: Сохранить текущее совместное ожидание через `refreshPromise`**

```ts
if (refreshPromise) {
  return refreshPromise
}
```

- [ ] **Step 3: Добавить тест на сетевую ошибку без немедленного logout**

```ts
it('keeps auth state when refresh throws a transient network error', async () => {
  global.fetch = vi.fn().mockRejectedValue(new TypeError('network'))

  await refreshAccessToken()

  expect(useAuthStore.getState().refreshToken).toBe('valid-refresh')
})
```

- [ ] **Step 4: Запустить frontend auth tests**

Run: `cd front && bun test src/modules/auth/lib/__tests__/authSession.test.ts`

Expected: PASS.

- [ ] **Step 5: Закоммитить устойчивую обработку refresh**

```bash
git add front/src/modules/auth/lib/authSession.ts front/src/modules/auth/lib/__tests__/authSession.test.ts
git commit -m "fix: стабилизирована обработка ошибок refresh токена"
```

### Task 4: Убедиться, что `createRequest()` корректно повторяет запрос после refresh

**Files:**
- Modify: `front/src/shared/api/apiUtils.ts`
- Create: `front/src/shared/api/__tests__/apiUtils.test.ts`
- Test: `front/src/shared/api/__tests__/apiUtils.test.ts`

- [ ] **Step 1: Написать падающий тест на retry исходного запроса после refresh**

```ts
it('retries the original request with a new access token after 401', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ accessToken: 'new-access', refreshToken: 'new-refresh', user }), { status: 200 })
    )
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

  global.fetch = fetchMock as Mock

  const response = await createRequest('/api/comments')

  expect(response.status).toBe(200)
  expect(fetchMock).toHaveBeenCalledTimes(3)
})
```

- [ ] **Step 2: Реализовать или уточнить retry только после успешного refresh**

```ts
const refreshed = await refreshAccessToken()
if (!refreshed) {
  return response
}
```

- [ ] **Step 3: Добавить проверку, что retry использует новый bearer token**

```ts
expect(fetchMock.mock.calls[2][1]?.headers.get('Authorization')).toBe('Bearer new-access')
```

- [ ] **Step 4: Запустить тесты api utils**

Run: `cd front && bun test src/shared/api/__tests__/apiUtils.test.ts`

Expected: PASS.

- [ ] **Step 5: Закоммитить retry-поведение**

```bash
git add front/src/shared/api/apiUtils.ts front/src/shared/api/__tests__/apiUtils.test.ts
git commit -m "test: добавлен retry запросов после обновления access токена"
```

## Chunk 3: Добавить превентивное продление токена

### Task 5: Выделить вычисление времени следующего refresh

**Files:**
- Modify: `front/src/modules/auth/lib/authSession.ts`
- Create: `front/src/modules/auth/lib/__tests__/tokenRefreshSchedule.test.ts`
- Test: `front/src/modules/auth/lib/__tests__/tokenRefreshSchedule.test.ts`

- [ ] **Step 1: Написать падающий тест для вычисления задержки до refresh**

```ts
it('schedules refresh before token expiration with safety leeway', () => {
  const token = createJwtWithExp(nowInSeconds + 300)

  const delay = getRefreshDelayMs(token, 60)

  expect(delay).toBe(240_000)
})
```

- [ ] **Step 2: Реализовать небольшую pure function для расчёта задержки**

```ts
export const getRefreshDelayMs = (token: string, leewaySeconds = 60) => {
  const payload = parseJwtPayload(token)
  const exp = typeof payload?.exp === 'number' ? payload.exp : 0
  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, (exp - now - leewaySeconds) * 1000)
}
```

- [ ] **Step 3: Запустить unit-тест функции расчёта**

Run: `cd front && bun test src/modules/auth/lib/__tests__/tokenRefreshSchedule.test.ts`

Expected: PASS.

- [ ] **Step 4: Закоммитить helper расчёта расписания**

```bash
git add front/src/modules/auth/lib/authSession.ts front/src/modules/auth/lib/__tests__/tokenRefreshSchedule.test.ts
git commit -m "test: добавлен расчёт времени превентивного refresh"
```

### Task 6: Подключить планировщик refresh в `AuthProvider`

**Files:**
- Modify: `front/src/app/providers/AuthProvider.tsx`
- Create: `front/src/app/providers/__tests__/AuthProvider.test.tsx`
- Test: `front/src/app/providers/__tests__/AuthProvider.test.tsx`

- [ ] **Step 1: Написать падающий тест на автозапуск refresh до истечения токена**

```tsx
it('triggers refresh before access token expires', async () => {
  vi.useFakeTimers()
  useAuthStore.setState({
    accessToken: createJwtWithExp(nowInSeconds + 120),
    refreshToken: 'valid-refresh',
    user,
  })

  render(<AuthProvider><div>app</div></AuthProvider>)

  await vi.advanceTimersByTimeAsync(61_000)

  expect(refreshAccessToken).toHaveBeenCalled()
})
```

- [ ] **Step 2: Добавить в `AuthProvider` планирование `setTimeout` по `getRefreshDelayMs()`**

```tsx
useEffect(() => {
  if (!accessToken || !refreshToken) return

  const timeoutId = window.setTimeout(() => {
    void refreshAccessToken()
  }, getRefreshDelayMs(accessToken))

  return () => window.clearTimeout(timeoutId)
}, [accessToken, refreshToken])
```

- [ ] **Step 3: Убедиться, что bootstrap и таймер не вызывают дублирующий refresh**

```tsx
if (refreshToken && (!accessToken || isTokenExpired(accessToken))) {
  await refreshAccessToken()
}
```

- [ ] **Step 4: Запустить тесты `AuthProvider`**

Run: `cd front && bun test src/app/providers/__tests__/AuthProvider.test.tsx`

Expected: PASS.

- [ ] **Step 5: Закоммитить превентивное продление токена**

```bash
git add front/src/app/providers/AuthProvider.tsx front/src/app/providers/__tests__/AuthProvider.test.tsx
git commit -m "fix: добавлено автоматическое продление access токена"
```

## Chunk 4: Проверить backend и регрессию целиком

### Task 7: Пройти auth contract на backend

**Files:**
- Modify: `api/src/auth/auth.service.ts` (only if tests from Chunk 1 found a defect)
- Test: `api/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Если auth tests упали, внести минимальную правку в backend**

```ts
const user = await this.validateRefreshToken(userId, refreshToken)
const tokens = await this.issueAndStoreTokens(user)
return this.buildAuthResponse(user, tokens)
```

- [ ] **Step 2: Повторно запустить auth tests**

Run: `cd api && bun test src/auth/auth.service.spec.ts`

Expected: PASS.

- [ ] **Step 3: Закоммитить backend fix only if code changed**

```bash
git add api/src/auth/auth.service.ts api/src/auth/auth.service.spec.ts
git commit -m "fix: уточнена ротация refresh токена"
```

### Task 8: Выполнить итоговую проверку сценария сессии

**Files:**
- Test: `front/src/modules/auth/lib/__tests__/authSession.test.ts`
- Test: `front/src/shared/api/__tests__/apiUtils.test.ts`
- Test: `front/src/app/providers/__tests__/AuthProvider.test.tsx`
- Test: `api/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Запустить релевантные frontend tests**

Run: `cd front && bun test src/modules/auth/lib/__tests__/authSession.test.ts src/shared/api/__tests__/apiUtils.test.ts src/app/providers/__tests__/AuthProvider.test.tsx`

Expected: PASS.

- [ ] **Step 2: Запустить релевантные backend tests**

Run: `cd api && bun test src/auth/auth.service.spec.ts`

Expected: PASS.

- [ ] **Step 3: Проверить рабочее дерево**

Run: `git status --short`

Expected: only intended auth-related files are modified.

- [ ] **Step 4: Финальный коммит реализации**

```bash
git add front/src/app/providers/AuthProvider.tsx front/src/modules/auth/lib/authSession.ts front/src/shared/api/apiUtils.ts front/src/modules/auth/lib/__tests__/authSession.test.ts front/src/shared/api/__tests__/apiUtils.test.ts front/src/app/providers/__tests__/AuthProvider.test.tsx api/src/auth/auth.service.ts api/src/auth/auth.service.spec.ts
git commit -m "fix: стабилизировано автоматическое продление авторизации"
```
