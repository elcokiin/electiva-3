const htmlStyle = `
  <style>
    body {
      font-family: "Georgia", "Times New Roman", serif;
      font-size: 12px;
      color: red;
    }
  </style>
`;

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    if (
      request.destination === "image" &&
      request.url.includes("/img/main.jpg")
    ) {
      return fetch("img/main-patas-arriba.jpg");
    }

    const response = await fetch(request);

    if (!response.ok) {
      return request.destination === "image"
        ? fetch("img/main-patas-arriba.jpg")
        : response;
    }

    const contentType = response.headers.get("content-type") || "";
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (acceptsHtml || contentType.includes("text/html")) {
      const html = await response.text();
      const updatedHtml = html.includes("</head>")
        ? html.replace("</head>", `${htmlStyle}</head>`)
        : `${htmlStyle}${html}`;

      return new Response(updatedHtml, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return response;
  } catch (error) {
    if (request.destination === "image") {
      return fetch("img/main-patas-arriba.jpg");
    }

    if (request.headers.get("accept")?.includes("text/html")) {
      return new Response(
        `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" />${htmlStyle}</head><body><main><h1>Servicio no disponible</h1><p>Intenta nuevamente.</p></main></body></html>`,
        { status: 503, headers: { "content-type": "text/html" } },
      );
    }

    return new Response("", { status: 503 });
  }
}
