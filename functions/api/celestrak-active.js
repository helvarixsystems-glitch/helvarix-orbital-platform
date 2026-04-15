const JSON_SOURCES = [
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json",
  "https://www.celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json",
  "https://celestrak.org/norad/elements/gp.php?GROUP=active&FORMAT=json",
  "https://www.celestrak.org/norad/elements/gp.php?GROUP=active&FORMAT=json"
];

const TLE_SOURCES = [
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
  "https://www.celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
  "https://celestrak.org/norad/elements/gp.php?GROUP=active&FORMAT=tle",
  "https://www.celestrak.org/norad/elements/gp.php?GROUP=active&FORMAT=tle"
];

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Accept": "application/json,text/plain,text/html;q=0.9,*/*;q=0.8"
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}

function jsonToItems(data) {
  if (!Array.isArray(data)) return [];

  return data
    .map((row) => {
      const name = String(row.OBJECT_NAME || row.NAME || "").trim();
      const norad = String(
        row.NORAD_CAT_ID || row.NORAD_CATID || row.OBJECT_ID || ""
      ).trim();
      const l1 = String(row.TLE_LINE1 || row.LINE1 || "").trim();
      const l2 = String(row.TLE_LINE2 || row.LINE2 || "").trim();

      if (!name || !l1.startsWith("1 ") || !l2.startsWith("2 ")) return null;

      return { name, norad, l1, l2 };
    })
    .filter(Boolean);
}

function tleTextToItems(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out = [];

  for (let i = 0; i < lines.length - 2; i++) {
    const name = lines[i];
    const l1 = lines[i + 1];
    const l2 = lines[i + 2];

    if (l1.startsWith("1 ") && l2.startsWith("2 ")) {
      const norad = l1.slice(2, 7).trim();
      out.push({ name, norad, l1, l2 });
      i += 2;
    }
  }

  return out;
}

export async function onRequestGet() {
  let lastError = "Unknown upstream failure";

  for (const url of JSON_SOURCES) {
    try {
      const upstream = await fetchWithTimeout(url, 15000);

      if (!upstream.ok) {
        lastError = `Upstream ${url} returned HTTP ${upstream.status}`;
        continue;
      }

      const data = await upstream.json();
      const items = jsonToItems(data);

      if (!items.length) {
        lastError = `Upstream ${url} returned JSON, but no usable TLE records were found`;
        continue;
      }

      return new Response(
        JSON.stringify({
          source: url,
          format: "json",
          count: items.length,
          items
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=300"
          }
        }
      );
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  for (const url of TLE_SOURCES) {
    try {
      const upstream = await fetchWithTimeout(url, 15000);

      if (!upstream.ok) {
        lastError = `Upstream ${url} returned HTTP ${upstream.status}`;
        continue;
      }

      const text = await upstream.text();
      const items = tleTextToItems(text);

      if (!items.length) {
        lastError = `Upstream ${url} returned text, but no usable TLE records were found`;
        continue;
      }

      return new Response(
        JSON.stringify({
          source: url,
          format: "tle",
          count: items.length,
          items
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=300"
          }
        }
      );
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return new Response(
    JSON.stringify({
      error: `Proxy error: ${lastError}`
    }),
    {
      status: 502,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    }
  );
}
