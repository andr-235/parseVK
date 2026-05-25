import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[background-color,color,border,box-shadow,transform] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 focus-visible:border-transparent active:translate-y-[1px] aria-invalid:ring-destructive/25 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-accent-primary text-primary-foreground shadow-soft-sm hover:bg-accent-primary/90 hover:shadow-soft-md',
        destructive:
          'bg-destructive text-destructive-foreground shadow-soft-sm hover:bg-destructive/90 focus-visible:ring-destructive/35',
        outline:
          'border border-border/70 bg-transparent text-text-primary hover:border-accent-primary/40 hover:bg-accent-primary/10 hover:text-accent-primary',
        secondary: 'bg-muted text-text-primary shadow-soft-sm hover:bg-muted/80',
        ghost: 'text-text-secondary hover:bg-muted/60 hover:text-text-primary',
        link: 'text-accent-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-11 px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
