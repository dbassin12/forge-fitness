/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { APP_BASE, APP_NAME, appForPath } from './app/appId'
import { bridgeGet, personalize, type SwContext } from './sw-bridge'

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<PrecacheEntry | string> }

/**
 * One worker script serves both apps: Forge registers it for `/`, Bloom for `/bloom/`. The scope
 * says which app this copy belongs to (its icon, default links and stored context).
 */
const APP = appForPath(new URL(self.registration.scope).pathname)
const BASE = APP_BASE[APP]

// ---- Offline app shell -------------------------------------------------------
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Each app's pages open its own shell (Forge's worker may see a first visit to /bloom/ too).
const forgeShell = createHandlerBoundToURL('/index.html')
const bloomShell = createHandlerBoundToURL('/bloom/index.html')
registerRoute(
  new NavigationRoute((options) => (appForPath(options.url.pathname) === 'bloom' ? bloomShell(options) : forgeShell(options)), {
    denylist: [/^\/api\//],
  }),
)

// Open Food Facts product lookups: network first, fall back to cache when offline.
registerRoute(
  ({ url }) => url.hostname.endsWith('openfoodfacts.org'),
  new NetworkFirst({
    cacheName: 'off-api',
    networkTimeoutSeconds: 6,
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
)

// Product images.
registerRoute(
  ({ request, url }) => request.destination === 'image' && url.origin !== self.location.origin,
  new CacheFirst({
    cacheName: 'remote-images',
    plugins: [new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
)

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') void self.skipWaiting()
})

// ---- Push notifications ---------------------------------------------------------
interface PushPayload {
  title?: string
  body?: string
  url?: string
  tag?: string
  type?: string
  meal?: string
}

async function show(data: PushPayload) {
  let text: { title: string; body: string } | null = null
  try {
    text = personalize(data.type ?? '', await bridgeGet<SwContext>(APP, 'context'), data.meal)
  } catch {
    /* fall back to the server's text */
  }
  // Always show a notification: iOS revokes push permission for silent pushes.
  await self.registration.showNotification(text?.title || data.title || APP_NAME[APP], {
    body: text?.body || data.body || (APP === 'bloom' ? 'A gentle moment for you 🌸' : 'Time for a quick check-in 💪'),
    icon: `${BASE}icons/icon-192.png`,
    badge: `${BASE}icons/icon-192.png`,
    tag: data.tag,
    data: { url: data.url || `${BASE}#/today` },
  })
}

self.addEventListener('push', (event) => {
  let data: PushPayload
  try {
    data = event.data ? (event.data.json() as PushPayload) : {}
  } catch {
    data = { body: event.data?.text() }
  }
  event.waitUntil(show(data))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data as { url?: string } | undefined)?.url || `${BASE}#/today`
  event.waitUntil(
    (async () => {
      // Only this app's windows (Forge and Bloom can both be open on one phone).
      const all = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter((c) => appForPath(new URL(c.url).pathname) === APP)
      for (const client of all) {
        if ('focus' in client) {
          await client.focus()
          if ('navigate' in client) {
            try {
              await (client as WindowClient).navigate(target)
            } catch {
              /* cross-origin or not allowed — focusing is enough */
            }
          }
          return
        }
      }
      await self.clients.openWindow(target)
    })(),
  )
})
