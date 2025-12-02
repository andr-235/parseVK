import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[background-color,color,border,box-shadow,transform] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-transparent active:translate-y-[1px] aria-invalid:ring-destructive/25 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-accent-primary to-[#1d4ed8] text-primary-foreground shadow-soft-md hover:from-[#1d4ed8] hover:to-[#1e40af] hover:shadow-[0_18px_45px_-20px_rgba(37,99,235,0.7)] dark:from-[#3b82f6] dark:to-[#2563eb] dark:hover:from-[#2563eb] dark:hover:to-[#1d4ed8] dark:shadow-[0_20px_50px_-22px_rgba(59,130,246,0.6)]',
        destructive:
          'bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-soft-md hover:from-[#dc2626] hover:to-[#b91c1c] hover:shadow-[0_18px_45px_-20px_rgba(239,68,68,0.55)] focus-visible:ring-destructive/35 dark:from-[#f87171] dark:to-[#ef4444] dark:hover:from-[#ef4444] dark:hover:to-[#dc2626]',
        outline:
          'border border-accent-primary/40 bg-background-secondary/70 text-text-primary shadow-[0_10px_35px_-24px_rgba(37,99,235,0.55)] hover:border-accent-primary/70 hover:bg-accent-primary/10 hover:text-accent-primary dark:border-accent-primary/35 dark:bg-white/10 dark:text-text-light dark:hover:bg-accent-primary/25 dark:hover:text-text-light',
        secondary:
          'bg-gradient-to-r from-background-secondary via-background-secondary/95 to-background-secondary text-text-primary shadow-soft-sm hover:from-accent-primary/15 hover:via-accent-primary/12 hover:to-accent-primary/15 dark:from-white/15 dark:via-white/12 dark:to-white/15 dark:text-text-light dark:hover:from-white/25 dark:hover:via-white/18 dark:hover:to-white/25',
        ghost:
          'text-text-secondary hover:bg-accent-primary/15 hover:text-accent-primary dark:text-text-light dark:bg-white/5 dark:hover:bg-accent-primary/25 dark:hover:text-text-light',
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
