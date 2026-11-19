import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { MapPin, User, Clock, Navigation } from 'lucide-react';

interface LocationEntry {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  created_at: string;
  profile?: { name: string };
}

const LocationTrackingPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, userRole } = useAuth();
  const [locations, setLocations] = useState<LocationEntry[]>([]);

  const fetchLocations = useCallback(async () => {
    // Get latest location per employee
    const { data } = await supabase
      .from('location_tracking')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));

      // Get latest per user
      const latestMap = new Map<string, typeof data[0]>();
      data.forEach(d => {
        if (!latestMap.has(d.user_id)) latestMap.set(d.user_id, d);
      });

      setLocations(Array.from(latestMap.values()).map(d => ({ ...d, profile: profileMap[d.user_id] })));
    }
  }, []);

  useEffect(() => {
    if (userRole !== 'admin') return;
    fetchLocations();
    const interval = setInterval(fetchLocations, 10000);
    const channel = supabase
      .channel('location-tracking-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_tracking' }, () => fetchLocations())
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchLocations, userRole]);

  // Employee: send location continuously (live)
  useEffect(() => {
    if (userRole === 'admin' || !user) return;

    let watchId: number | null = null;
    let lastSent = 0;

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const now = Date.now();
          if (now - lastSent < 15000) return; // throttle to 15s
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
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [user, userRole]);


  if (userRole !== 'admin') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground font-cairo gold-text">{t('location.title')}</h1>
        <Card className="p-12 ramadan-card text-center">
          <Navigation className="h-12 w-12 mx-auto mb-3" style={{ color: 'hsl(42 85% 55%)' }} />
          <p className="text-foreground font-cairo font-bold">{t('location.tracking')}</p>
          <p className="text-sm text-muted-foreground mt-2 font-cairo">يتم إرسال موقعك تلقائياً كل دقيقة</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground font-cairo gold-text">{t('location.title')}</h1>

      {locations.length === 0 ? (
        <Card className="p-12 ramadan-card text-center">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground font-cairo">{t('location.noData')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(loc => (
            <Card key={loc.id} className="p-5 ramadan-card shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(42 85% 50% / 0.15)' }}>
                  <User className="h-5 w-5" style={{ color: 'hsl(42 85% 55%)' }} />
                </div>
                <div>
                  <p className="font-semibold text-foreground font-cairo">{loc.profile?.name || 'موظف'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(loc.created_at).toLocaleString('ar-EG')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <a
                  href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-cairo"
                >
                  {loc.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`}
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationTrackingPage;
