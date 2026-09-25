const CACHE_NAME = 'task-alarm-v2';

// Danh sách tài nguyên cần lưu để dùng Offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
];

// 1. Cài đặt Service Worker (Bỏ qua file lỗi, không làm dừng SW)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Đang lưu cache...');
      // Dùng Promise.allSettled để nếu 1 file lỗi thì các file còn lại vẫn được lưu bình thường
      await Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => console.warn('[SW] Không thể lưu file:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// 2. Kích hoạt & dọn dẹp Cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Xử lý yêu cầu khi Offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nếu là API Cloudflare Functions: Cho phép đi qua hoặc trả về cờ offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ offline: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Đối với trang web và giao diện: Ưu tiên lấy từ Cache trước
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        // Khi mất mạng hoàn toàn và truy cập lại trang gốc
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});
