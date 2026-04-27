interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'blue' | 'reserved'
  className?: string
}

const variants = {
  default:  'bg-ap-surface-2 text-ap-text-2',
  success:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  warning:  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  danger:   'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  blue:     'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  reserved: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
