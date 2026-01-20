import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'

type SectionKey = 'vk' | 'monitoring' | 'parsing'

export const useSidebarState = () => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    vk: true,
    monitoring: true,
    parsing: false,
  })

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
