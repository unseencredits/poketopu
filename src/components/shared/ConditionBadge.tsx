import { CONDITIONS, type Condition } from '@/types'

interface Props {
  condition?: Condition | null
  grader?: string | null
  grade?: number | null
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function ConditionBadge({ condition, grader, grade, showLabel = true, size = 'md' }: Props) {
  const cls = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  if (grader && grade != null) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-violet-50 text-violet-700 border border-violet-200 ${cls}`}>
        {grader}
        <span>{grade % 1 === 0 ? grade.toFixed(0) : grade}</span>
      </span>
    )
  }

  if (!condition) return null

  const { label, stars } = CONDITIONS[condition]
  const colorCls = `condition-${condition.toLowerCase()}`

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${colorCls} ${cls}`}>
      <Stars count={stars} />
      {showLabel && <span>{label}</span>}
    </span>
  )
}

function Stars({ count }: { count: number }) {
  return (
    <span className="tracking-[-2px]">
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  )
}
