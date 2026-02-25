export async function onRequestGet({ request }) {
  const url = new URL(request.url);

  const command = url.searchParams.get("command");
  const center  = url.searchParams.get("center");
  const start   = url.searchParams.get("start");
  const stop    = url.searchParams.get("stop");
  const stepMin = url.searchParams.get("stepMin") || "5";

  if (!command || !center || !start || !stop) {
    return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
  }

  const upstream = new URL("https://ssd.jpl.nasa.gov/api/horizons.api");
  upstream.searchParams.set("format", "json");
  upstream.searchParams.set("MAKE_EPHEM", "YES");
  upstream.searchParams.set("EPHEM_TYPE", "VECTORS");
  upstream.searchParams.set("OBJ_DATA", "NO");
  upstream.searchParams.set("COMMAND", `'${command}'`);
  upstream.searchParams.set("CENTER", `'${center}'`);
  upstream.searchParams.set("START_TIME", `'${start}'`);
  upstream.searchParams.set("STOP_TIME", `'${stop}'`);
  upstream.searchParams.set("STEP_SIZE", `'${stepMin} m'`);
  upstream.searchParams.set("OUT_UNITS", "KM-S");
  upstream.searchParams.set("VEC_TABLE", "2");
  upstream.searchParams.set("CSV_FORMAT", "YES");
  upstream.searchParams.set("VEC_LABELS", "NO");
  upstream.searchParams.set("CAL_FORMAT", "JD");

  const res = await fetch(upstream.toString());
  const raw = await res.json();

  return new Response(JSON.stringify(raw), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
