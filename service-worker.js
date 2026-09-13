var CACHE_NAME = "skincare-cache-v1";
var APP_SHELL = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js",
  "./js/routines.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  var url = new URL(event.request.url);
  var isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // App-Shell: cache-first, im Hintergrund aktualisieren.
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        var networkFetch = fetch(event.request)
          .then(function (response) {
            if (response && response.ok) {
              var copy = response.clone();
              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(event.request, copy);
              });
            }
            return response;
          })
          .catch(function () { return cached; });
        return cached || networkFetch;
      })
    );
  } else {
    // Externe Requests (z.B. Google-Sheets-CSV): network-first, Cache als Offline-Fallback.
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          if (response && response.ok) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(event.request);
        })
    );
  }
});
