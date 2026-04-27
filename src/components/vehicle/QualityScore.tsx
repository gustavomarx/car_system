interface QualityScoreProps {
  score: number
}

export function QualityScore({ score }: QualityScoreProps) {
  const label =
    score >= 80 ? 'Ótimo anúncio!' :
    score >= 50 ? 'Anúncio regular' : 'Anúncio fraco'

  const barColor =
    score >= 80 ? 'bg-emerald-500' :
    score >= 50 ? 'bg-amber-400' : 'bg-red-400'

  const textColor =
    score >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
    score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'

  return (
    <div className="ap-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-ap-text">Qualidade do Anúncio</p>
        <span className="text-sm font-bold text-ap-text">{score}%</span>
      </div>

      <div className="relative h-3 rounded-full overflow-hidden mb-2 bg-ap-surface-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-base">
        <span title="Início">🚗</span>
        <div className="flex-1 mx-2 border-t-2 border-dashed border-ap-border" />
        <span title="Objetivo: vender rápido!">💰</span>
      </div>

      <p className={`text-xs font-medium mt-2 ${textColor}`}>{label}</p>

      {score < 80 && (
        <ul className="mt-2 text-xs text-ap-text-2 list-disc pl-4 space-y-0.5">
          {score < 40 && <li>Adicione mais fotos do veículo</li>}
          {score < 60 && <li>Escreva uma descrição com pelo menos 50 caracteres</li>}
          {score < 80 && <li>Preencha todos os dados do veículo</li>}
        </ul>
      )}
    </div>
  )
}
