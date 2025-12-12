import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface UseDriverLocationOptions {
  orderId: string | null;
  enabled: boolean;
  updateInterval?: number; // in milliseconds
}

export const useDriverLocation = ({ 
  orderId, 
  enabled, 
  updateInterval = 5000 
}: UseDriverLocationOptions) => {
  const { user } = useAuth();
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const updateDriverLocation = useCallback(async (position: GeolocationPosition) => {
    if (!user) return;

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Skip if location hasn't changed significantly (within ~10 meters)
    if (lastLocationRef.current) {
      const latDiff = Math.abs(lat - lastLocationRef.current.lat);
      const lngDiff = Math.abs(lng - lastLocationRef.current.lng);
      if (latDiff < 0.0001 && lngDiff < 0.0001) {
        console.log('Location unchanged, skipping update');
        return;
      }
    }

    lastLocationRef.current = { lat, lng };
    console.log('Updating driver location:', { lat, lng, userId: user.id });

    try {
      // Update driver location in profiles table (not orders)
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: lat,
          longitude: lng,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating driver location:', error);
      } else {
        console.log('Driver location updated successfully');
      }
    } catch (error) {
      console.error('Failed to update driver location:', error);
    }
  }, [user]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    // Log silently - don't spam user with toasts for repeated errors
    console.warn('Geolocation error:', error.code, error.message);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée');
      return;
    }

    console.log('Starting driver location tracking');

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      updateDriverLocation,
      handleError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateDriverLocation,
      handleError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Also send updates at regular intervals
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        updateDriverLocation,
        handleError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }, updateInterval);
  }, [updateDriverLocation, handleError, updateInterval]);

  const stopTracking = useCallback(() => {
    console.log('Stopping driver location tracking');
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    lastLocationRef.current = null;
  }, []);

  useEffect(() => {
    if (enabled && user) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, user, startTracking, stopTracking]);

  return {
    startTracking,
    stopTracking
  };
};

export default useDriverLocation;
