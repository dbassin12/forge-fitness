import { Settings } from 'lucide-react'
import { PageHeader } from '@/ui/PageHeader'
import { ComingSoon } from '@/ui/ComingSoon'

export default function MorePage() {
  return (
    <>
      <PageHeader title="More" subtitle="Settings, reminders and your coach" />
      <div className="px-4">
        <ComingSoon icon={<Settings />} title="Settings are coming">
          Profile, equipment, reminders, voice, AI coach and backups will live here.
        </ComingSoon>
      </div>
    </>
  )
}
