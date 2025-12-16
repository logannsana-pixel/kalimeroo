import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RouteResult {
  coordinates: [number, number][];
  distance: number; // km
  duration: number; // minutes
}

interface Location {
  lat: number;
  lng: number;
}

export const useRoute = () => {
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRoute = useCallback(async (start: Location | null, end: Location | null) => {
    // Early return if locations are missing
    if (!start || !end || !start.lat || !start.lng || !end.lat || !end.lng) {
      console.log("Missing location data for route fetch");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching route from", start, "to", end);

      const { data, error: fnError } = await supabase.functions.invoke("get-route", {
        body: { start, end },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log("Route received:", data);
      setRoute(data);
      return data;
    } catch (err: any) {
      console.error("Error fetching route:", err);
      setError(err.message);
      // Return fallback direct line
      return {
        coordinates: [
          [start.lat, start.lng],
          [end.lat, end.lng],
        ],
        distance: 0,
        duration: 0,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return {
    route,
    loading,
    error,
    fetchRoute,
    clearRoute,
  };
};