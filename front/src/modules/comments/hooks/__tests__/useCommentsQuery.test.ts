import { describe, expect, it } from 'vitest'
import { shouldNotifyCommentsSyncError } from '../useCommentsQuery'

describe('shouldNotifyCommentsSyncError', () => {
  it('returns true for initial sync failure without loaded comments', () => {
    expect(shouldNotifyCommentsSyncError(true, true, false)).toBe(true)
  })

  it('returns false for background sync failure when comments are already loaded', () => {
    expect(shouldNotifyCommentsSyncError(true, true, true)).toBe(false)
  })

  it('returns false when sync is disabled or there is no error', () => {
    expect(shouldNotifyCommentsSyncError(false, true, false)).toBe(false)
    expect(shouldNotifyCommentsSyncError(true, false, false)).toBe(false)
  })
})
