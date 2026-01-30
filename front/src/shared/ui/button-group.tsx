import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps } from 'class-variance-authority'

import { buttonGroupVariants } from './button-group-variants'
import { cn } from '@/shared/utils'
import { Separator } from '@/shared/ui/separator'

type ButtonGroupProps = React.ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof buttonGroupVariants>

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        data-slot="button-group"
        data-orientation={orientation}
        className={cn(buttonGroupVariants({ orientation }), className)}
        {...props}
      />
    )
  }
)

ButtonGroup.displayName = 'ButtonGroup'

type ButtonGroupTextProps = React.ComponentPropsWithoutRef<'div'> & {
  asChild?: boolean
}

const ButtonGroupText = React.forwardRef<React.ElementRef<'div'>, ButtonGroupTextProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div'

    return (
      <Comp
        ref={ref}
        className={cn(
          "bg-muted/70 shadow-soft-sm flex items-center gap-2 rounded-lg border border-border/60 px-4 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
          className
        )}
        {...props}
      />
    )
  }
)

ButtonGroupText.displayName = 'ButtonGroupText'

function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        'bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto',
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText }
