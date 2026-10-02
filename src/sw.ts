/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { bridgeGet, personalize, type SwContext } from './sw-bridge'

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<PrecacheEntry | string> }

// ---- Offline app shell -------------------------------------------------------
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
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
    text = personalize(data.type ?? '', await bridgeGet<SwContext>('context'), data.meal)
  } catch {
    /* fall back to the server's text */
  }
  // Always show a notification: iOS revokes push permission for silent pushes.
  await self.registration.showNotification(text?.title || data.title || 'Forge', {
    body: text?.body || data.body || 'Time for a quick check-in 💪',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag,
    data: { url: data.url || '/#/today' },
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
  const target = (event.notification.data as { url?: string } | undefined)?.url || '/#/today'
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
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
