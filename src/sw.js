const images = ["cat.svg", "dog.svg", "horse.svg", "rabbit.svg"];
let currentImage = "dog.svg";
let shouldSwap = false;
let swappedImage = null;

self.addEventListener("install", (event) => {
  console.log("Service worker installing....");

  event.waitUntil(
    caches
      .open("cacheApp")
      .then((cache) => cache.addAll(images)),
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

    // Responder al cliente con la imagen elegida
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
  } else {
    e.respondWith(fetch(e.request));
  }
});
