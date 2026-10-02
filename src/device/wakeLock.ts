type Sentinel = { release: () => Promise<void>; released?: boolean }

let sentinel: Sentinel | null = null
let wanted = false

async function acquire(): Promise<boolean> {
  try {
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock
    if (!wl) return false
    sentinel = await wl.request('screen')
    return true
  } catch {
    return false
  }
}

function onVisibility() {
  if (wanted && document.visibilityState === 'visible') void acquire()
}

/** Keep the screen awake during a workout (re-acquired after the app returns to the foreground). */
export async function keepAwake(): Promise<boolean> {
  wanted = true
  document.addEventListener('visibilitychange', onVisibility)
  return acquire()
}

export async function releaseAwake(): Promise<void> {
  wanted = false
  document.removeEventListener('visibilitychange', onVisibility)
  try {
    await sentinel?.release()
  } catch {
    /* ignore */
  }
  sentinel = null
}

export function wakeLockSupported(): boolean {
  return 'wakeLock' in navigator
}
