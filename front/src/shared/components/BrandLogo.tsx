import type { ImgHTMLAttributes } from 'react'

import { cn } from '@/shared/utils'

const baseUrl = import.meta.env?.BASE_URL ?? '/'
const logoSrc = `${baseUrl}logo.png`

type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<BrandLogoSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28',
  xl: 'h-[512px] w-[512px] max-h-[60vh] max-w-full',
}

type BrandLogoProps = ImgHTMLAttributes<HTMLImageElement> & {
  size?: BrandLogoSize
}

export function BrandLogo({
  size = 'md',
  className,
  alt = 'Логотип ParseVK',
  ...props
}: BrandLogoProps) {
  return (
    <img
      src={logoSrc}
      alt={alt}
      className={cn('shrink-0 object-contain', sizeClasses[size], className)}
      {...props}
    />
  )
}
