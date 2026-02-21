const images = ["cat.svg", "dog.svg", "horse.svg", "rabbit.svg"];
let currentImage = "dog.svg";
let shouldSwap = false;
let swappedImage = null;

self.addEventListener("install", (event) => {
  console.log("Service worker installing....");

  event.waitUntil(
    caches.open("cacheApp").then((cache) => cache.addAll(images)),
  );
});

self.addEventListener("activate", (event) => {
  console.log("Handling fetches!!");
});

self.addEventListener("message", (event) => {
  if (event.data.action === "swap") {
    currentImage = event.data.current;
    const others = images.filter((img) => img !== currentImage);
    swappedImage = others[Math.floor(Math.random() * others.length)];
    currentImage = swappedImage;
    shouldSwap = true;

    event.source.postMessage({
      action: "swapped",
      image: swappedImage,
    });
  }
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const isAnimalImage = images.some((img) => url.pathname.includes(img));

  if (isAnimalImage && shouldSwap) {
    shouldSwap = false;
    e.respondWith(caches.match(swappedImage));
    return;
  }

  if (url.pathname.endsWith("/api/search")) {
    const query = url.searchParams.get("q") || "";
    const results = images.filter((img) =>
      img.replace(".svg", "").toLowerCase().includes(query.toLowerCase()),
    );

    const responseData =
      results.length > 0
        ? { found: true, images: results, first: results[0] }
        : { found: false, message: "Animal no encontrado para: " + query };

    e.respondWith(
      new Response(JSON.stringify(responseData), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    return;
  }

  if (url.pathname.endsWith("/api/random")) {
    const randomImage = images[Math.floor(Math.random() * images.length)];

    e.respondWith(
      caches.open("cacheApp").then((cache) => {
        return cache.match(randomImage).then((cachedResponse) => {
          if (cachedResponse) {
            return new Response(cachedResponse.body, {
              headers: {
                "Content-Type": "image/svg+xml",
                "X-Animal-Name": randomImage,
              },
            });
          }
          return new Response(
            JSON.stringify({ error: "Imagen no encontrada en cache" }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        });
      }),
    );
    return;
  }

  e.respondWith(fetch(e.request));
});
