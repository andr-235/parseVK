export const getAuthorInitials = (name: string): string => {
    const sanitized = name.replace(/^https?:\/\//, '')
  
    if (!sanitized.trim()) {
      return '—'
    }
  
    if (sanitized.startsWith('vk.com/id')) {
      return 'VK'
    }
  
    const parts = sanitized.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) {
      return sanitized.charAt(0).toUpperCase() || '—'
    }
  
    const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
    return initials || parts[0].charAt(0).toUpperCase() || '—'
  }