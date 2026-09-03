const CACHE_NAME = 'pharmacy-app-v1';
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon.png'
];

// تثبيت ملفات التطبيق في ذاكرة الهاتف
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
});

// تشغيل التطبيق من الذاكرة عند انقطاع الإنترنت
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
