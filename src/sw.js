let useCat = false;

self.addEventListener("install", (event) => {
  console.log("Service worker installing....");

  event.waitUntil(
    caches.open("chaceApp").then((cache) => cache.add("cat.svg")),
  );
});

self.addEventListener("activate", (event) => {
  console.log("Handling fetches!!");
});

self.addEventListener("message", (event) => {
  if (event.data.action === "switchToCat") {
    useCat = true;
  }
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.includes("dog.svg") && useCat) {
    e.respondWith(caches.match("cat.svg"));
  } else {
    e.respondWith(fetch(e.request));
  }
});
