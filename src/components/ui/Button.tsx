import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  children:  ReactNode
}

const sizeStyles: Record<Size, { height: number; padding: string; fontSize: number }> = {
  sm: { height: 28,  padding: '0 10px', fontSize: 11.5 },
  md: { height: 32,  padding: '0 14px', fontSize: 12.5 },
  lg: { height: 38,  padding: '0 20px', fontSize: 13.5 },
}

export default function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled,
  children,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const sz = sizeStyles[size]
  const variantClass =
    variant === 'primary'   ? 's-btn s-btn-primary'   :
    variant === 'secondary' ? 's-btn s-btn-secondary'  :
    variant === 'danger'    ? 's-btn s-btn-danger'     :
    's-btn'

  return (
    <button
      disabled={disabled || loading}
      className={`${variantClass} ${className}`}
      style={{
        height:   sz.height,
        padding:  sz.padding,
        fontSize: sz.fontSize,
        opacity:  disabled || loading ? 0.5 : 1,
        cursor:   disabled || loading ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...props}
    >
      {loading && (
        <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}