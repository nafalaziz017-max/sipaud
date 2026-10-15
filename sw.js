/* Service worker SiPaud Absensi
   - Hanya menangani berkas dari situs sendiri (halaman, CSS, JS, ikon).
   - Permintaan ke Firebase/Google TIDAK disentuh, jadi data absen selalu langsung ke server.
   - Strategi: coba jaringan dulu (supaya update langsung terpakai), cadangan dari cache saat sinyal hilang. */
const CACHE = 'sipaud-absen-v1';
const ASET = ['absen.html', 'absen.css', 'absen.js', 'firebase-config.js', 'styles.css', 'script.js', 'pwa.js',
  'manifest.json', 'logo.png', 'favicon.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASET)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res && res.ok) { const salin = res.clone(); caches.open(CACHE).then(c => c.put(r, salin)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('absen.html') : undefined)))
  );
});
