import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authorsService } from '@/services/authorsService'
import { useAuthorsStore } from '@/stores'
import type { AuthorDetails } from '@/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'
import type { AuthorAnalysisLocationState } from '@/types/authorAnalysis'
import { isValidAuthorId } from '@/utils/authorAnalysisUtils'

/**
 * Кастомный хук для управления данными автора
 * Обрабатывает загрузку автора из API или из состояния location
 */
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

  // Загрузка автора из состояния location
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

  // Загрузка автора из API
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

  // Отметка автора как проверенного
  useEffect(() => {
    if (!author?.vkUserId || !author.verifiedAt) {
      return
    }

    markAuthorVerified(author.vkUserId, author.verifiedAt)
  }, [author?.vkUserId, author?.verifiedAt, markAuthorVerified])

  return {
    author,
    isAuthorLoading,
    vkUserId,
    isValidAuthor,
  }
}