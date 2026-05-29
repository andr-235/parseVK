import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

type SectionKey = 'vk' | 'monitoring' | 'parsing' | 'telegram'

const isNarrowViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

export const useSidebarState = () => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(() => isNarrowViewport())
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    vk: true,
    monitoring: true,
    parsing: false,
    telegram: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleViewportChange = () => {
      if (mediaQuery.matches) {
        setIsCollapsed(true)
      }
    }

    handleViewportChange()
    mediaQuery.addEventListener('change', handleViewportChange)

    return () => mediaQuery.removeEventListener('change', handleViewportChange)
  }, [])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const isSectionActive = useCallback(
    (paths: string[]) => {
      return paths.some((path) => location.pathname.startsWith(path))
    },
    [location.pathname]
  )

  const isSectionExpanded = useCallback(
    (sectionKey: SectionKey) => {
      return expandedSections[sectionKey] ?? false
    },
    [expandedSections]
  )

  const toggleSection = useCallback(
    (sectionKey: SectionKey) => {
      if (isCollapsed) return
      setExpandedSections((prev) => ({
        ...prev,
        [sectionKey]: !prev[sectionKey],
      }))
    },
    [isCollapsed]
  )

  const expandSection = useCallback((sectionKey: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: true,
    }))
  }, [])

  return {
    isCollapsed,
    toggleCollapse,
    setIsCollapsed,
    isSectionActive,
    isSectionExpanded,
    toggleSection,
    expandSection,
  }
}
