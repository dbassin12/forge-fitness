import { UtensilsCrossed } from 'lucide-react'
import { PageHeader } from '@/ui/PageHeader'
import { ComingSoon } from '@/ui/ComingSoon'

export default function EatPage() {
  return (
    <>
      <PageHeader title="Eat" subtitle="Calories, protein and meal plans" />
      <div className="px-4">
        <ComingSoon icon={<UtensilsCrossed />} title="Nutrition tracking is coming">
          Food logging, barcode scanning, meal plans and grocery lists will live here.
        </ComingSoon>
      </div>
    </>
  )
}
