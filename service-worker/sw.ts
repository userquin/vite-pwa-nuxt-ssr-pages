/// <reference lib="WebWorker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// self.__WB_MANIFEST is the default injection point
precacheAndRoute(self.__WB_MANIFEST)

// clean old assets
cleanupOutdatedCaches()

let allowlist: RegExp[] | undefined
let denylist: RegExp[] | undefined
// in dev mode, we disable precaching to avoid caching issues
if (import.meta.env.DEV)
  allowlist = [/^\/$/]

if (import.meta.env.PROD) {
  const products = /^\/products$/
  const product = /^\/products\//
  const api = /^\/api\//
  denylist = [api, products, product]

  registerRoute(
    ({ sameOrigin, request }) => {
      const url = new URL(request.url, self.origin)
      const result = sameOrigin && (
          (request.destination === 'document' && products.test(url.pathname)) ||
          (request.destination === 'document' && product.test(url.pathname)) ||
          api.test(url.pathname)
      )

      console.log(`[SW] ${result ? 'Allow' : 'Deny'} ${url.pathname}`)

      return result
    },
    new NetworkFirst({
      cacheName: 'ssr-pages-caches',
      matchOptions: {
        ignoreVary: true,
        ignoreSearch: true
      },
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        // we only need a few entries
        new ExpirationPlugin({ maxEntries: 100 }),
        {
            cachedResponseWillBeUsed: async (params) => {
              // When handlerDidError is invoked, then we can prevent redirecting if there is an entry in the cache.
              // To check the behavior, navigate to a product page, then disable the network and refresh the page.
              params.state ??= {}
              params.state.dontRedirect = params.cachedResponse
              console.log(`[SW] cachedResponseWillBeUsed ${params.request.url}, ${params.state ? JSON.stringify(params.state) : ''}`)
            },
            // This callback will be called when the fetch call fails.
            // Beware of the logic, will be also invoked if the server is down.
            handlerDidError: async ({ request, state, error }) => {
                if (state?.dontRedirect)
                    return state.dontRedirect

                console.log(`[SW] handlerDidError ${request.url}, ${state ? JSON.stringify(state) : ''}`)
                return error && 'name' in error && error.name === 'no-response' ? Response.redirect('/offline', 302) : undefined
            },
        }
      ],
    }),
  )
}


// to allow work offline
registerRoute(new NavigationRoute(
  createHandlerBoundToURL('/'),
  { allowlist, denylist },
))

self.skipWaiting()
clientsClaim()
