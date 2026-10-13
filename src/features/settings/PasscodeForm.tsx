import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { setPasscode } from '@/state/reminders'
import { Button } from '@/ui/Button'

/** Saves the access code (APP_PASSCODE) the phone sends to the server for reminders. */
export function PasscodeForm({ className }: { className?: string }) {
  const [code, setCode] = useState('')
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        if (code.trim()) void setPasscode(code.trim())
      }}
    >
      <label className="block text-sm text-muted" htmlFor="passcode">
        Access code <span className="text-faint">(the APP_PASSCODE you set in Vercel)</span>
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="passcode"
          type="password"
          autoComplete="current-password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-2xl border border-line bg-surface px-3 outline-none focus:border-ember"
        />
        <Button type="submit" icon={<KeyRound size={16} />} disabled={!code.trim()}>
          Save
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-faint">Forgot it? It’s in Vercel: your project → Settings → Environment Variables → APP_PASSCODE.</p>
    </form>
  )
}
