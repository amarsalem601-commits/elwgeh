import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Continuously send the current device location for non-admin users.
 * Runs as long as the component using it stays mounted.
 */
export function useLiveLocation() {
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (!user || userRole === 'admin') return;
    if (!('geolocation' in navigator)) return;

    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSent < 15000) return;
        lastSent = now;
        await supabase.from('location_tracking').insert({
          user_id: user.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, userRole]);
}
