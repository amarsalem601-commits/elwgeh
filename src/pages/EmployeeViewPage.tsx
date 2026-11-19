import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Warehouse, FileText, Users, Truck, User, Phone, MapPin, Radio, Clock, Navigation } from 'lucide-react';

const pageIcons: Record<string, React.FC<{ className?: string }>> = {
  products: Package,
  sales: ShoppingCart,
  purchases: ShoppingCart,
  inventory: Warehouse,
  reports: FileText,
  customers: Users,
  suppliers: Truck,
};

interface LocationPing {
  id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  created_at: string;
}

const EmployeeViewPage: React.FC = () => {
  const { userId } = useParams();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<{ name: string; phone: string } | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [showLocation, setShowLocation] = useState(false);
  const [latest, setLatest] = useState<LocationPing | null>(null);
  const [history, setHistory] = useState<LocationPing[]>([]);
  const [isLive, setIsLive] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    const { data: p } = await supabase.from('profiles').select('name, phone').eq('user_id', userId).single();
    setProfile(p);
    const { data: perms } = await supabase.from('employee_permissions').select('page_key').eq('user_id', userId);
    setPermissions(perms?.map(d => d.page_key) || []);
  }, [userId]);

  const fetchLocation = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('location_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data && data.length > 0) {
      setLatest(data[0]);
      setHistory(data);
      const ageSec = (Date.now() - new Date(data[0].created_at).getTime()) / 1000;
      setIsLive(ageSec < 60);
    }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Live updates: profile + permissions + location
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`employee-view-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` }, fetchProfile)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_permissions', filter: `user_id=eq.${userId}` }, fetchProfile)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_tracking', filter: `user_id=eq.${userId}` }, fetchLocation)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchProfile, fetchLocation]);

  // Poll location while panel open
  useEffect(() => {
    if (!showLocation) return;
    fetchLocation();
    const i = setInterval(fetchLocation, 8000);
    return () => clearInterval(i);
  }, [showLocation, fetchLocation]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-cairo flex items-center gap-2">
              {profile?.name || '...'}
              <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE
              </span>
            </h1>
            <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {profile?.phone || '-'}</p>
          </div>
        </div>

        <Button onClick={() => setShowLocation(s => !s)} className="gap-2 font-cairo">
          <MapPin className="h-4 w-4" />
          {showLocation ? 'إخفاء التتبع' : 'تتبع الموقع مباشر'}
        </Button>
      </div>

      {showLocation && (
        <Card className="p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${isLive ? 'text-emerald-500 animate-pulse' : 'text-muted-foreground'}`} />
            <span className="font-cairo font-semibold">
              {isLive ? 'البث المباشر نشط' : latest ? 'آخر تحديث متأخر' : 'لا توجد بيانات موقع'}
            </span>
          </div>

          {latest ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <a
                  href={`https://www.google.com/maps?q=${latest.latitude},${latest.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline font-cairo"
                >
                  {latest.address || `${latest.latitude.toFixed(5)}, ${latest.longitude.toFixed(5)}`}
                </a>
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                  <Clock className="h-3 w-3" />
                  {new Date(latest.created_at).toLocaleString('ar-EG')}
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-border" style={{ height: 320 }}>
                <iframe
                  title="live-map"
                  className="w-full h-full"
                  src={`https://www.google.com/maps?q=${latest.latitude},${latest.longitude}&z=16&output=embed`}
                />
              </div>

              {history.length > 1 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs text-muted-foreground font-cairo mb-1">آخر التحديثات</p>
                  {history.slice(1).map(h => (
                    <div key={h.id} className="text-xs flex items-center justify-between p-2 rounded bg-muted/40">
                      <span className="font-mono">{h.latitude.toFixed(5)}, {h.longitude.toFixed(5)}</span>
                      <span className="text-muted-foreground">{new Date(h.created_at).toLocaleTimeString('ar-EG')}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground font-cairo">
              <Navigation className="h-10 w-10 mx-auto mb-2 opacity-50" />
              في انتظار إرسال الموقع من جهاز الموظف...
            </div>
          )}
        </Card>
      )}

      <h2 className="text-lg font-semibold text-foreground font-cairo">{t('employees.assignedPages')}</h2>

      {permissions.length === 0 ? (
        <Card className="p-8 shadow-card text-center">
          <p className="text-muted-foreground">{t('employees.noPermissionsShort')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissions.map(key => {
            const Icon = pageIcons[key] || Package;
            return (
              <Card key={key} className="p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">{t(`nav.${key}`)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeViewPage;
