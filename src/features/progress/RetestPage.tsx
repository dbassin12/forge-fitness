import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { isBloom } from '@/app/brand'
import { db } from '@/db/db'
import { XP } from '@/engines/gamification'
import type { FitnessTest as TestResult } from '@/engines/plan/types'
import { applyTest } from '@/engines/progression/progress'
import { uid } from '@/lib/id'
import { addXp, computeStats, unlockAchievements } from '@/state/gamification'
import { usePlan } from '@/state/plan'
import { saveProgress } from '@/state/store'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { BloomCheckIn } from '../onboarding/BloomCheckIn'
import { FOLD_REACH } from '../onboarding/choices'
import { FitnessTest } from '../onboarding/FitnessTest'

/** The 4-weekly check-in (Forge: the same three tests; Bloom: fold and balance), compared with last time. */
export default function RetestPage() {
  const plan = usePlan()
  const navigate = useNavigate()
  const [result, setResult] = useState<TestResult | null>(null)
  const [startedAt] = useState(() => Date.now())
  if (!plan) return null
  const prev = plan.progress.tests[plan.progress.tests.length - 1]

  const save = async (r: TestResult) => {
    setResult(r)
    const state = applyTest(structuredClone(plan.progress), r)
    await saveProgress(state)
    await db.workouts.add({
      id: uid('w'),
      date: r.date,
      startedAt,
      finishedAt: Date.now(),
      sessionKey: 'fitness-test',
      title: isBloom ? 'Check-in' : 'Fitness test',
      kind: 'test',
      exercises: [],
      calories: 15,
      xp: XP.test,
    })
    await addXp('test', XP.test, r.date)
    await unlockAchievements(await computeStats(plan.profile, state, r.date))
  }

  const row = (label: string, now?: number, before?: number, unit = '') => (
    <div className="flex items-center justify-between border-t border-line/60 py-2.5 text-sm first:border-t-0">
      <span>{label}</span>
      <span className="tabular">
        <b>{now ?? '—'}</b>
        {now !== undefined ? unit : ''}
        {now !== undefined && before !== undefined ? (
          <span className={now >= before ? 'ml-2 text-good' : 'ml-2 text-muted'}>
            {now >= before ? '+' : ''}
            {now - before}
          </span>
        ) : null}
      </span>
    </div>
  )

  return (
    <div className="min-h-dvh px-4 pb-8 safe-top">
      <div className="flex items-center pt-2">
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
          <ArrowLeft size={22} />
        </button>
      </div>
      {result ? (
        <div className="mt-4">
          <TrendingUp size={40} className="text-ember" />
          <h1 className="mt-2 font-display text-3xl font-bold">Check-in saved</h1>
          <p className="mt-1 text-muted">{isBloom ? 'Your poses were updated from these results.' : 'Your exercise levels were updated from these results.'}</p>
          {isBloom ? (
            <Card className="mt-5 py-1">
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span>Forward fold reaches</span>
                <span>
                  <b>{result.foldReach !== undefined ? FOLD_REACH[result.foldReach] : '—'}</b>
                  {result.foldReach !== undefined && prev?.foldReach !== undefined && prev.foldReach !== result.foldReach ? (
                    <span className={result.foldReach > prev.foldReach ? 'ml-2 text-good' : 'ml-2 text-muted'}>was {FOLD_REACH[prev.foldReach].toLowerCase()}</span>
                  ) : null}
                </span>
              </div>
              {row('Balance on one foot', result.balanceSec, prev?.balanceSec, ' s')}
            </Card>
          ) : (
            <Card className="mt-5 py-1">
              {row('Push-ups', result.pushups, prev?.pushups)}
              {row('Squats in 60 s', result.squats60, prev?.squats60)}
              {row('Plank', result.plankSec, prev?.plankSec, ' s')}
            </Card>
          )}
          <Button block size="lg" className="mt-6" onClick={() => navigate('/progress', { replace: true })}>
            Done
          </Button>
        </div>
      ) : (
        <div className="mt-2">
          {isBloom ? <BloomCheckIn onDone={(r) => void save(r)} /> : <FitnessTest onDone={(r) => void save(r)} />}
        </div>
      )}
    </div>
  )
}
