import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
// Использование services для одноразовой операции (загрузка данных автора)
// Это допустимо согласно правилам архитектуры для операций, не требующих глобального состояния
import { authorsService } from '@/services/authorsService'
import { useAuthorsStore } from '@/store'
import { createEmptyPhotoAnalysisSummary, type AuthorDetails } from '@/types'
import type { AuthorAnalysisLocationState } from '@/types/authorAnalysis'
import { isValidAuthorId } from '@/modules/authorAnalysis/utils/authorAnalysisUtils'
export const useAuthorData = () => {
  const params = useParams<{ vkUserId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const vkUserId = Number(params.vkUserId)
  const isValidAuthor = isValidAuthorId(vkUserId)

  const [author, setAuthor] = useState<AuthorDetails | null>(null)
  const [isAuthorLoading, setIsAuthorLoading] = useState(false)

  const locationState = location.state as AuthorAnalysisLocationState | null
  const markAuthorVerified = useAuthorsStore((state) => state.markAuthorVerified)
  const verifyAuthor = useAuthorsStore((state) => state.verifyAuthor)

  useEffect(() => {
    if (!locationState?.author || author) {
      return
    }

    const { author: stateAuthor, summary } = locationState

    setAuthor({
      id: 0,
      vkUserId: stateAuthor.vkUserId,
      firstName: stateAuthor.firstName ?? '',
      lastName: stateAuthor.lastName ?? '',
      fullName: stateAuthor.fullName ?? `id${stateAuthor.vkUserId}`,
      photo50: stateAuthor.avatar ?? null,
      photo100: stateAuthor.avatar ?? null,
      photo200: stateAuthor.avatar ?? null,
      domain: stateAuthor.domain ?? null,
      screenName: stateAuthor.screenName ?? null,
      profileUrl: stateAuthor.profileUrl ?? null,
      summary: summary ?? createEmptyPhotoAnalysisSummary(),
      photosCount: null,
      audiosCount: null,
      videosCount: null,
      friendsCount: null,
      followersCount: null,
      lastSeenAt: null,
      verifiedAt: null,
      isVerified: false,
      city: null,
      country: null,
      createdAt: '',
      updatedAt: '',
    })
  }, [author, locationState])

  useEffect(() => {
    if (!isValidAuthor) {
      toast.error('Некорректный идентификатор пользователя')
      navigate('/watchlist', { replace: true })
      return
    }

    setIsAuthorLoading(true)
    authorsService
      .getAuthorDetails(vkUserId)
      .then((details) => {
        setAuthor(details)
      })
      .catch(() => {
        toast.error('Не удалось загрузить данные пользователя')
        navigate('/watchlist', { replace: true })
      })
      .finally(() => {
        setIsAuthorLoading(false)
      })
  }, [isValidAuthor, navigate, vkUserId])

  useEffect(() => {
    if (!author?.vkUserId || !author.verifiedAt) {
      return
    }

    markAuthorVerified(author.vkUserId, author.verifiedAt)
  }, [author?.vkUserId, author?.verifiedAt, markAuthorVerified])

  const handleVerifyAuthor = useCallback(async () => {
    if (!author || author.verifiedAt) {
      return
    }

    try {
      const verifiedAt = await verifyAuthor(author.vkUserId)
      setAuthor((prev) => (prev ? { ...prev, verifiedAt, isVerified: true } : prev))
    } catch (error) {
      console.error('Не удалось отметить автора как проверенного', error)
    }
  }, [author, verifyAuthor])

  return {
    author,
    isAuthorLoading,
    vkUserId,
    isValidAuthor,
    handleVerifyAuthor,
  }
}
