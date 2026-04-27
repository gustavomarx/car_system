import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  primary:   'bg-ap-primary text-white hover:bg-ap-primary-2 active:opacity-90 disabled:opacity-40 shadow-sm',
  secondary: 'bg-ap-surface-2 text-ap-text hover:opacity-80 active:opacity-70 border border-ap-border',
  ghost:     'text-ap-text-2 hover:bg-ap-surface-2 active:opacity-70',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:opacity-90',
}

const sizes = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-4 text-sm rounded-xl',
  lg: 'h-14 px-6 text-base rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
