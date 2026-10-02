import { TrendingUp } from 'lucide-react'
import { PageHeader } from '@/ui/PageHeader'
import { ComingSoon } from '@/ui/ComingSoon'

export default function ProgressPage() {
  return (
    <>
      <PageHeader title="Progress" subtitle="Trends, records and your skill tree" />
      <div className="px-4">
        <ComingSoon icon={<TrendingUp />} title="Progress tracking is coming">
          Weight trends, personal records, weekly reviews and the calisthenics skill tree will live here.
        </ComingSoon>
      </div>
    </>
  )
}
