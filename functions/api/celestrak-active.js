export async function onRequestGet() {
  try {
    const upstream = await fetch(
      "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
      {
        headers: {
          "User-Agent": "Helvarix-Orbital-Platform/1.0"
        }
      }
    );

    if (!upstream.ok) {
      return new Response(
        `Upstream CelesTrak error: ${upstream.status}`,
        {
          status: upstream.status,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const text = await upstream.text();

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (error) {
    return new Response(
      `Proxy error: ${error instanceof Error ? error.message : String(error)}`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
