/* Service worker — ทำให้แอปเปิดได้ตอนไม่มีสัญญาณ
   เปลี่ยนเลข CACHE ทุกครั้งที่แก้ index.html เพื่อให้เครื่องพนักงานโหลดเวอร์ชันใหม่ */
const CACHE = "pump-selector-v1";
const FILES = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // การซิงก์สเปกต้องเอาของสดเสมอ ไม่เอาจากแคช
  if (url.pathname.includes("/macros/")) {
    e.respondWith(fetch(e.request).catch(() => new Response("{}", {
      headers: { "Content-Type": "application/json" }
    })));
    return;
  }

  // ที่เหลือ: ใช้เน็ตก่อน ถ้าไม่มีค่อยหยิบจากแคช
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
