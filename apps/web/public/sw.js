// no-op service worker stub — satisfies browser/extension probes
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
