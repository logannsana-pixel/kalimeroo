import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RouteRequest {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { start, end }: RouteRequest = await req.json();

    if (!start || !end) {
      throw new Error("Start and end coordinates are required");
    }

    console.log(`Fetching route from ${start.lat},${start.lng} to ${end.lat},${end.lng}`);

    const apiKey = Deno.env.get("OPENROUTESERVICE_API_KEY");
    if (!apiKey) {
      throw new Error("OpenRouteService API key not configured");
    }

    // Call OpenRouteService Directions API
    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          "Authorization": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [start.lng, start.lat], // ORS uses [lng, lat] format
            [end.lng, end.lat],
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouteService error:", errorText);
      throw new Error(`OpenRouteService API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract route information
    const feature = data.features?.[0];
    if (!feature) {
      throw new Error("No route found");
    }

    const properties = feature.properties;
    const geometry = feature.geometry;

    // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
    const routeCoordinates = geometry.coordinates.map((coord: number[]) => [
      coord[1],
      coord[0],
    ]);

    const result = {
      coordinates: routeCoordinates,
      distance: Math.round(properties.summary.distance / 1000 * 10) / 10, // km with 1 decimal
      duration: Math.round(properties.summary.duration / 60), // minutes
    };

    console.log(`Route found: ${result.distance}km, ${result.duration}min`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-route function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});