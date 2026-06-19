import { CONDITIONS, type Condition } from '@/types'

interface Props {
  condition: Condition
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function ConditionBadge({ condition, showLabel = true, size = 'md' }: Props) {
  const { label, stars } = CONDITIONS[condition]
  const cls = `condition-${condition.toLowerCase()}`

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${cls} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
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
