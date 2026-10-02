import type { ReactNode } from 'react'
import { Card } from './Card'

export function ComingSoon({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card className="mt-4 flex items-start gap-3">
      <div className="mt-0.5 text-ember">{icon}</div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{children}</p>
      </div>
    </Card>
  )
}
