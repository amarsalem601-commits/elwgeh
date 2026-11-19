import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, MapPin, Clock, LogIn, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AttendanceRecord {
  id: string;
  user_id: string;
  type: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  created_at: string;
  profile?: { name: string };
}

const AttendancePage: React.FC = () => {
  const { t } = useLanguage();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [checkType, setCheckType] = useState<'check_in' | 'check_out'>('check_in');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchRecords = useCallback(async () => {
    let query = supabase.from('attendance').select('*').order('created_at', { ascending: false }).limit(50);
    if (userRole !== 'admin') {
      query = query.eq('user_id', user?.id);
    }
    const { data } = await query;
    if (data) {
      // Fetch profiles for admin
      if (userRole === 'admin' && data.length > 0) {
        const userIds = [...new Set(data.map(d => d.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
        setRecords(data.map(d => ({ ...d, profile: profileMap[d.user_id] })));
      } else {
        setRecords(data);
      }
    }
  }, [user, userRole]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const startCamera = (type: 'check_in' | 'check_out') => {
    setCheckType(type);
    setCameraOpen(true);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        toast({ title: 'لا يمكن الوصول للكاميرا', variant: 'destructive' });
        setCameraOpen(false);
      }
    }, 100);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const captureAndSubmit = async () => {
    if (!canvasRef.current || !videoRef.current || !user) return;
    setLoading(true);

    // Capture photo
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7));

    stopCamera();

    // Get location
    let latitude: number | null = null;
    let longitude: number | null = null;
    let address: string | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch { /* location not available */ }

    // Upload photo
    let photo_url: string | null = null;
    if (blob) {
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('attendance-photos').upload(fileName, blob, { contentType: 'image/jpeg' });
      if (!error) {
        const { data: urlData } = supabase.storage.from('attendance-photos').getPublicUrl(fileName);
        photo_url = urlData.publicUrl;
      }
    }

    // Insert record
    await supabase.from('attendance').insert({
      user_id: user.id,
      type: checkType,
      photo_url,
      latitude,
      longitude,
      address,
    });

    toast({ title: t('attendance.success') });
    setLoading(false);
    fetchRecords();
  };

  return (
    <div className="space-y-6" translate="no">
      <h1 className="text-2xl font-bold text-foreground font-cairo gold-text">{t('attendance.title')}</h1>

      {/* Action buttons for employees */}
      {userRole !== 'admin' && (
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => startCamera('check_in')}
            className="h-24 text-lg font-cairo gap-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, hsl(145 65% 35%), hsl(145 65% 45%))' }}
          >
            <LogIn className="h-6 w-6" /> {t('attendance.checkIn')}
          </Button>
          <Button
            onClick={() => startCamera('check_out')}
            className="h-24 text-lg font-cairo gap-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, hsl(0 65% 45%), hsl(0 65% 55%))' }}
          >
            <LogOut className="h-6 w-6" /> {t('attendance.checkOut')}
          </Button>
        </div>
      )}

      {/* Camera modal */}
      {cameraOpen && (
        <Card className="p-4 ramadan-card">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-3">
            <Button onClick={captureAndSubmit} disabled={loading} className="flex-1 gradient-primary gap-2 font-cairo">
              <Camera className="h-4 w-4" /> {loading ? t('attendance.capturing') : t('attendance.takePhoto')}
            </Button>
            <Button variant="outline" onClick={stopCamera} className="font-cairo">{t('cancel')}</Button>
          </div>
        </Card>
      )}

      {/* Records */}
      <Card className="shadow-card ramadan-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold font-cairo text-foreground">{t('attendance.history')}</h2>
        </div>
        {records.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground font-cairo">{t('attendance.noRecords')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {records.map(r => (
              <div key={r.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                {r.photo_url ? (
                  <img src={r.photo_url} alt="" className="h-14 w-14 rounded-xl object-cover border-2" style={{ borderColor: 'hsl(42 85% 50% / 0.3)' }} />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {userRole === 'admin' && r.profile && (
                    <p className="font-semibold text-foreground font-cairo text-sm">{r.profile.name}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold font-cairo ${
                      r.type === 'check_in' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {r.type === 'check_in' ? t('attendance.checkIn') : t('attendance.checkOut')}
                    </span>
                  </div>
                  {r.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {r.address}
                    </p>
                  )}
                </div>
                <div className="text-end">
                  <p className="text-sm text-foreground font-cairo">
                    {new Date(r.created_at).toLocaleTimeString('ar-EG')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AttendancePage;
