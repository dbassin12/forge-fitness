import { usePrefs, type CoachStyle } from '@/app/prefs'

/** Moments where the coach says something with personality. */
export type CoachMoment = 'start' | 'half' | 'oneMore' | 'setDone' | 'rest' | 'lastRound' | 'workoutDone' | 'record' | 'tenLeft'

const LINES: Record<CoachStyle, Record<CoachMoment, string[]>> = {
  hype: {
    start: ['Let’s go!', 'Showtime!', 'Here we go, let’s get it!', 'Time to cook!'],
    half: ['Halfway there!', 'Halfway! You’re flying!', 'Halfway, keep that fire!'],
    oneMore: ['One more!', 'Last one, make it count!', 'One more, let’s go!'],
    setDone: ['Yes! Crushed it!', 'Boom! That’s how it’s done!', 'Nailed it!', 'Beast mode!', 'Let’s go! Great set!'],
    rest: ['Shake it out. You earned this rest.', 'Breathe. Next one’s gonna be even better.', 'Quick rest, then we go again!'],
    lastRound: ['Last round! Empty the tank!', 'Final round, everything you’ve got!'],
    workoutDone: ['Workout complete! You absolutely crushed it!', 'Done! That was legendary!'],
    record: ['New record! Unreal!', 'That’s a new personal best! Let’s go!'],
    tenLeft: ['Ten seconds! Push!', 'Ten more seconds, dig deep!'],
  },
  calm: {
    start: ['Here we go. Nice and steady.', 'Let’s begin. Smooth and controlled.'],
    half: ['Halfway. You’re doing great.', 'Halfway there. Keep it steady.'],
    oneMore: ['One more.', 'Last one, nice and smooth.'],
    setDone: ['Nice work.', 'Well done.', 'Great job, that looked good.', 'Lovely set.'],
    rest: ['Take a breath. You’re doing well.', 'Relax your shoulders and breathe.'],
    lastRound: ['Last round. Finish strong.', 'Final round. You’ve got this.'],
    workoutDone: ['Workout complete. Really nice job today.', 'All done. Be proud of that.'],
    record: ['A new personal best. Well done.', 'That’s a new record. Great progress.'],
    tenLeft: ['Ten seconds left.', 'Ten more seconds.'],
  },
  drill: {
    start: ['Move it, move it!', 'On my count. Go!', 'No excuses today. Go!'],
    half: ['Halfway! Did I say slow down?', 'Halfway. Pick it up!'],
    oneMore: ['One more! Don’t you dare quit!', 'Last one! Make me proud!'],
    setDone: ['Acceptable. Barely. Good work.', 'That’s what I like to see!', 'Outstanding, recruit!', 'Not bad. Not bad at all.'],
    rest: ['Rest is earned. Don’t get comfortable.', 'Shake it off. Back to work soon.'],
    lastRound: ['Last round! Leave nothing behind!', 'Final round! Show me what you’ve got!'],
    workoutDone: ['Mission complete! Dismissed!', 'Done. That’s how soldiers are made.'],
    record: ['New record! Now that’s discipline!', 'Personal best! Outstanding!'],
    tenLeft: ['Ten seconds! Hold the line!', 'Ten seconds! Don’t you quit on me!'],
  },
  zen: {
    start: ['Breathe in. Let’s begin.', 'Find your breath. Now move.'],
    half: ['Halfway. Stay with your breath.', 'Halfway. Smooth and present.'],
    oneMore: ['One more. Slow and mindful.', 'One last breath, one last rep.'],
    setDone: ['Beautiful.', 'Well done. Notice how you feel.', 'Lovely. Let it settle.'],
    rest: ['Breathe in for four… and out for four.', 'Let your heart rate settle. Soft shoulders.'],
    lastRound: ['Last round. Stay present.', 'The final round. Breathe and flow.'],
    workoutDone: ['Practice complete. Thank your body.', 'All done. Carry this calm with you.'],
    record: ['A new personal best. Growth is quiet, then sudden.', 'New record. Well earned.'],
    tenLeft: ['Ten seconds. Breathe through it.', 'Ten more seconds, steady breath.'],
  },
}

let counter = 0

/** A line for this moment in the user's chosen coach style (rotates so it doesn't repeat). */
export function coachLine(moment: CoachMoment, style: CoachStyle = usePrefs.getState().coach): string {
  const list = LINES[style][moment]
  counter = (counter + 1) % 997
  return list[counter % list.length]
}

export const COACH_LINES = LINES
