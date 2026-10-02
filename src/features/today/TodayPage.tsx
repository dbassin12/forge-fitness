import { Flame } from 'lucide-react'
import { PageHeader } from '@/ui/PageHeader'
import { ComingSoon } from '@/ui/ComingSoon'

export default function TodayPage() {
  return (
    <>
      <PageHeader title="Today" subtitle="Your plan, calories and habits at a glance" />
      <div className="px-4">
        <ComingSoon icon={<Flame />} title="Your daily dashboard is on its way">
          Today's workout, calorie ring, water, streaks and a tip of the day will live here.
        </ComingSoon>
      </div>
    </>
  )
}
