import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { EdgeSwipeBack } from './EdgeSwipeBack'

export function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: ReactNode
  subtitle?: ReactNode
  back?: boolean | string
  right?: ReactNode
}) {
  const navigate = useNavigate()
  const goBack = () => (typeof back === 'string' ? navigate(back) : navigate(-1))
  return (
    <header className="safe-top sticky top-0 z-20 bg-bg/85 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 min-h-14">
        {back ? (
          <button
            aria-label="Back"
            className="-ml-2 h-10 w-10 grid place-items-center rounded-full text-muted hover:text-ink hover:bg-surface-2"
            onClick={goBack}
          >
            <ChevronLeft size={24} />
          </button>
        ) : null}
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-[26px] leading-tight font-bold truncate">{title}</h1>
          {subtitle ? <p className="text-sm text-muted truncate">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {back ? <EdgeSwipeBack onBack={goBack} /> : null}
    </header>
  )
}
