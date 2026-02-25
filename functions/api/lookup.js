export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const s = url.searchParams.get("s") || "";

  if (!s.trim()) {
    return new Response(JSON.stringify({ error: "Missing ?s=" }), { status: 400 });
  }

  const upstream = new URL("https://ssd.jpl.nasa.gov/api/horizons_lookup.api");
  upstream.searchParams.set("format", "json");
  upstream.searchParams.set("sstr", s);

  const res = await fetch(upstream.toString());
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
