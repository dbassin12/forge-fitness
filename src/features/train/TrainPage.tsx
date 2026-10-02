import { Dumbbell } from 'lucide-react'
import { PageHeader } from '@/ui/PageHeader'
import { ComingSoon } from '@/ui/ComingSoon'

export default function TrainPage() {
  return (
    <>
      <PageHeader title="Train" subtitle="Your personalized program" />
      <div className="px-4">
        <ComingSoon icon={<Dumbbell />} title="Workouts are being forged">
          Your weekly plan, follow-along sessions and the animated exercise library will live here.
        </ComingSoon>
      </div>
    </>
  )
}
