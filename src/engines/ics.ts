/** Minimal RFC 5545 calendar export: repeating workout events with alarms (a zero-setup backup). */

const DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

export function escText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Fold lines longer than 75 octets (continuation lines start with a space). */
export function fold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const out: string[] = []
  let cur = ''
  let size = 0
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length
    if (size + n > (out.length ? 74 : 75)) {
      out.push(cur)
      cur = ''
      size = 0
    }
    cur += ch
    size += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

const pad = (n: number) => String(n).padStart(2, '0')

function stamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

/** Floating local time ("YYYYMMDDTHHMMSS"): fires at that clock time wherever the phone is. */
function local(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const t = h * 60 + m + minutes
  return `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`
}

export interface IcsOptions {
  /** First occurrence date (YYYY-MM-DD) — use the next training day. */
  startDate: string
  trainingDays: number[]
  time: string
  minutes: number
  /** Saturday weigh-in reminder. */
  weighIn?: boolean
  weighInStartDate?: string
  now?: Date
}

export function buildIcs(o: IcsOptions): string {
  const now = o.now ?? new Date()
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Forge//Fitness reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  const days = [...new Set(o.trainingDays)].filter((d) => d >= 1 && d <= 7).sort()
  if (days.length) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:forge-workouts-${days.join('')}@forge-fitness`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${local(o.startDate, o.time)}`,
      `DTEND:${local(o.startDate, addMinutes(o.time, Math.max(5, o.minutes)))}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${days.map((d) => DAY_CODES[d - 1]).join(',')}`,
      `SUMMARY:${escText(`💪 Forge workout (${o.minutes} min)`)}`,
      `DESCRIPTION:${escText('Open Forge and tap Start. Short on time? The 5- or 10-minute express version still counts.')}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escText('Workout time 💪')}`,
      'TRIGGER:-PT10M',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  if (o.weighIn && o.weighInStartDate) {
    lines.push(
      'BEGIN:VEVENT',
      'UID:forge-weighin@forge-fitness',
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${local(o.weighInStartDate, '08:30')}`,
      `DTEND:${local(o.weighInStartDate, '08:35')}`,
      'RRULE:FREQ=WEEKLY;BYDAY=SA',
      `SUMMARY:${escText('⚖️ Forge weigh-in')}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escText('Weigh-in before breakfast')}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
