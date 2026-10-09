/* Cache toàn bộ trang để học được cả khi mất mạng.
   Đổi CACHE mỗi lần build lại dữ liệu để người học nhận bản mới. */

var CACHE = 'han-ngu-duong-v5';

var ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './data/vocab.js',
  './js/text.js',
  './js/store.js',
  './js/srs.js',
  './js/session.js',
  './js/app.js',
  './manifest.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE ? null : caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);
  // Font Google: lấy mạng trước, có bản cache thì dùng tạm khi offline.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
        return response;
      }).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Tài nguyên của trang: cache trước cho nhanh, nền vẫn cập nhật.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var network = fetch(event.request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
        return response;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
