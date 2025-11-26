// Service Worker mínimo, sem cache, só para permitir instalação como PWA

self.addEventListener('install', (event) => {
  // Faz o SW assumir imediatamente, sem ficar "esperando"
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Garante que o SW controla todas as abas abertas do site
  event.waitUntil(self.clients.claim());
});

// Nenhum fetch handler aqui -> não intercepta requisições
// Ou seja, o site continua carregando normalmente do servidor.
