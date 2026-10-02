import { Link } from 'react-router'
import { BookOpen, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/ui/PageHeader'
import { Card } from '@/ui/Card'
import { EXERCISES } from '@/data/exercises'

export default function TrainPage() {
  return (
    <>
      <PageHeader title="Train" subtitle="Your personalized program" />
      <div className="px-4">
        <Link to="/train/library">
          <Card className="flex items-center gap-3 active:scale-[0.99]">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ember/15 text-ember">
              <BookOpen size={22} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Exercise library</div>
              <div className="text-sm text-muted">{EXERCISES.length} animated guides with voiced tutorials</div>
            </div>
            <ChevronRight className="text-faint" />
          </Card>
        </Link>
      </div>
    </>
  )
}
