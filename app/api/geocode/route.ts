import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { address } = await req.json();
  if (!address)
    return NextResponse.json({ error: "Missing address" }, { status: 400 });

  const apiKey = process.env.ORS_API_KEY;
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(
    address
  )}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const coords = data?.features?.[0]?.geometry?.coordinates;
    if (coords)
      return NextResponse.json({
        lng: coords[0],
        lat: coords[1],
      });

    return NextResponse.json({ error: "No coordinates found" }, { status: 404 });
  } catch (err) {
    console.error("Geocoding error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
