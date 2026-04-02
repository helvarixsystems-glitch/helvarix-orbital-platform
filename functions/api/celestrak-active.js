const SOURCES = [
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
  "https://www.celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
  "https://celestrak.org/norad/elements/gp.php?GROUP=active&FORMAT=tle",
  "https://www.celestrak.org/norad/elements/gp.php?GROUP=active&FORMAT=tle"
];

async function fetchWithTimeout(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Helvarix-Orbital-Platform/1.0",
        "Accept": "text/plain,text/html;q=0.9,*/*;q=0.8"
      }
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequestGet() {
  let lastError = "Unknown upstream failure";

  for (const url of SOURCES) {
    try {
      const upstream = await fetchWithTimeout(url, 12000);

      if (!upstream.ok) {
        lastError = `Upstream ${url} returned HTTP ${upstream.status}`;
        continue;
      }

      const text = await upstream.text();

      if (!text || !text.includes("\n1 ") || !text.includes("\n2 ")) {
        lastError = `Upstream ${url} returned data, but it did not look like TLE content`;
        continue;
      }

      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300"
        }
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return new Response(`Proxy error: ${lastError}`, {
    status: 502,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
