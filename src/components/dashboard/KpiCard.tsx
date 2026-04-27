import Link from 'next/link'

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'violet'
  href?: string
}

const accents = {
  blue:   'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  green:  'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  amber:  'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  red:    'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
  violet: 'bg-ap-primary-sub text-ap-primary',
}

export function KpiCard({ label, value, sub, icon, accent = 'violet', href }: KpiCardProps) {
  const inner = (
    <div
      className={`ap-card p-4 shadow-sm transition-all ${href ? 'hover:shadow-md active:opacity-90 cursor-pointer' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accents[accent]}`}>
        {icon}
      </div>
      <p className="text-xs text-ap-text-2 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-base font-bold text-ap-text mt-0.5 leading-tight break-words">{value}</p>
      {sub && <p className="text-xs text-ap-text-3 mt-0.5">{sub}</p>}
      {href && <p className="text-[10px] text-ap-primary mt-1 font-medium">Ver detalhes →</p>}
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
