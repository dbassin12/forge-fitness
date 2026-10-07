/**
 * The bare app identity, safe to import anywhere (including the service worker, which has no
 * `document`). Everything richer lives in ./brand.ts.
 */
export type AppId = 'forge' | 'bloom'

export const APP_IDS: AppId[] = ['forge', 'bloom']

/** Where each app lives, with a trailing slash. */
export const APP_BASE: Record<AppId, string> = { forge: '/', bloom: '/bloom/' }

export const APP_NAME: Record<AppId, string> = { forge: 'Forge', bloom: 'Bloom' }

/** Which app a URL path belongs to. */
export function appForPath(pathname: string): AppId {
  return /^\/bloom(\/|$)/.test(pathname) ? 'bloom' : 'forge'
}
