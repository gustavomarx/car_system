import { PlusCircle, Pencil, DollarSign, Camera, BookmarkCheck, BookmarkX, FileEdit } from 'lucide-react'

interface HistoryEntry {
  id: string
  date: string
  action: string
  description: string
}

interface Props {
  entries: HistoryEntry[]
  newestFirst?: boolean
}

const actionConfig: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  created: {
    icon: <PlusCircle size={13} />,
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  edited: {
    icon: <Pencil size={13} />,
    bg: 'bg-blue-100 dark:bg-blue-950',
    color: 'text-blue-600 dark:text-blue-400',
  },
  sold: {
    icon: <DollarSign size={13} />,
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  photo_added: {
    icon: <Camera size={13} />,
    bg: 'bg-ap-primary-sub',
    color: 'text-ap-primary',
  },
  reserved: {
    icon: <BookmarkCheck size={13} />,
    bg: 'bg-violet-100 dark:bg-violet-950',
    color: 'text-violet-600 dark:text-violet-400',
  },
  unreserved: {
    icon: <BookmarkX size={13} />,
    bg: 'bg-amber-100 dark:bg-amber-950',
    color: 'text-amber-600 dark:text-amber-400',
  },
}

const fallbackConfig = {
  icon: <FileEdit size={13} />,
  bg: 'bg-ap-surface-2',
  color: 'text-ap-text-3',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function HistoryTimeline({ entries, newestFirst = true }: Props) {
  const ordered = newestFirst ? [...entries].reverse() : [...entries]

  if (ordered.length === 0) {
    return <p className="text-xs text-ap-text-3">Sem registros.</p>
  }

  return (
    <div className="flex flex-col">
      {ordered.map((entry, i) => {
        const config = actionConfig[entry.action] ?? fallbackConfig
        const isLast = i === ordered.length - 1

        return (
          <div key={entry.id} className="flex gap-3">
            {/* Coluna do ícone + linha vertical */}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                {config.icon}
              </div>
              {!isLast && (
                <div className="w-px flex-1 my-1" style={{ backgroundColor: 'var(--ap-border)' }} />
              )}
            </div>

            {/* Conteúdo */}
            <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-4'}`}>
              <p className="text-sm text-ap-text leading-snug">{entry.description}</p>
              <p className="text-xs text-ap-text-3 mt-0.5">{formatDate(entry.date)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
