import { APP } from '@/app/brand'
import { Download, PlusSquare, Share } from 'lucide-react'
import { isIOS, isStandalone, usePwa } from '@/app/pwa'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'

/** How to put the app on the home screen (needed on iPhone for notifications). */
export function InstallGuide({ compact = false }: { compact?: boolean }) {
  const installPrompt = usePwa((s) => s.installPrompt)
  const promptInstall = usePwa((s) => s.promptInstall)
  if (isStandalone()) return null
  if (installPrompt) {
    return (
      <Card className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ember/15 text-ember">
          <Download size={22} />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Install {APP.name}</div>
          <div className="text-sm text-muted">Full screen, works offline, sends reminders.</div>
        </div>
        <Button size="sm" onClick={() => void promptInstall()}>
          Install
        </Button>
      </Card>
    )
  }
  if (!isIOS()) {
    return compact ? null : (
      <Card>
        <div className="font-semibold">Install {APP.name}</div>
        <p className="mt-1 text-sm text-muted">
          Open your browser menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b>.
        </p>
      </Card>
    )
  }
  return (
    <Card>
      <div className="font-semibold">Add {APP.name} to your Home Screen</div>
      <p className="mt-1 text-sm text-muted">On iPhone, reminders only work once {APP.name} is on your Home Screen. It takes 10 seconds:</p>
      <ol className="mt-3 space-y-2.5 text-sm">
        <li className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-sky">
            <Share size={17} />
          </span>
          <span>
            Tap <b>Share</b> in Safari's toolbar.
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-sky">
            <PlusSquare size={17} />
          </span>
          <span>
            Scroll down and tap <b>Add to Home Screen</b>.
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ember/15 text-ember">
            <img src="/icons/favicon-64.png" alt="" className="h-5 w-5 rounded" />
          </span>
          <span>
            Open <b>{APP.name}</b> from your Home Screen and set it up there.
          </span>
        </li>
      </ol>
    </Card>
  )
}
