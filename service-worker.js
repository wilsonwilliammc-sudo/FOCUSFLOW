
const CACHE_NAME = 'focusflow-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalação: Cacheia arquivos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Estratégia de Fetch: Network-First com Fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignora requisições para a API do Gemini ou domínios externos de script para não quebrar a IA
  if (event.request.url.includes('generativelanguage.googleapis.com') || event.request.url.includes('esm.sh')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a rede funcionar, clona para o cache
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request)) // Se falhar a rede (offline), usa o cache
  );
});
