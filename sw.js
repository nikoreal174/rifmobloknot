"use strict";

const PREFIX = "rifmobloknot-" +
  encodeURIComponent(self.registration.scope) + "-";
const CACHE = PREFIX + "v1";
const HOME = new URL("./index.html", self.registration.scope).href;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([
      new URL("./", self.registration.scope).href,
      HOME
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(name => name.startsWith(PREFIX) && name !== CACHE)
        .map(name => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (
    event.request.method !== "GET" ||
    event.request.mode !== "navigate" ||
    !event.request.url.startsWith(self.registration.scope)
  ) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    try {
      const response = await fetch(event.request);
      if (response.ok) {
        await cache.put(HOME, response.clone());
        return response;
      }
      return (await cache.match(HOME)) || response;
    } catch {
      return (await cache.match(HOME)) || new Response(
        "Офлайн-копия пока не сохранена. Открой приложение с интернетом.",
        {status: 503, headers: {"Content-Type": "text/plain; charset=utf-8"}}
      );
    }
  })());
});
