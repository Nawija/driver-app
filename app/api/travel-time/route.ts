import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { origins, destinations } = await req.json();

  if (!origins || !destinations)
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

  const apiKey = process.env.ORS_API_KEY;

  // Zbuduj zapytanie do OpenRouteService API
  const url = "https://api.openrouteservice.org/v2/directions/driving-car";
  const body = {
    coordinates: [
      [origins.lng, origins.lat],
      [destinations.lng, destinations.lat],
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: apiKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data?.routes?.[0]?.summary?.duration) {
      return NextResponse.json({
        duration: data.routes[0].summary.duration, // sekundy
      });
    }

    return NextResponse.json({ error: "No route found" }, { status: 404 });
  } catch (err) {
    console.error("ORS error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
