import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Send, Check, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Employee {
  user_id: string;
  name: string;
}

const NotificationsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ user_id: '', title: '', message: '' });

  const fetchData = async () => {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (userRole !== 'admin') query = query.eq('user_id', user?.id);
    const { data } = await query;
    setNotifications(data || []);

    if (userRole === 'admin') {
      const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'employee');
      if (roles?.length) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', roles.map(r => r.user_id));
        setEmployees(profiles || []);
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSend = async () => {
    if (!form.user_id || !form.title) return;
    await supabase.from('notifications').insert({
      user_id: form.user_id,
      title: form.title,
      message: form.message,
    });
    toast({ title: t('notifications.send') });
    setDialogOpen(false);
    setForm({ user_id: '', title: '', message: '' });
    fetchData();
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    fetchData();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground font-cairo gold-text">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full text-xs font-bold" style={{ background: 'hsl(0 65% 50%)', color: 'white' }}>
              {unreadCount}
            </span>
          )}
        </div>
        {userRole === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-1 font-cairo"><Plus className="h-4 w-4" /> {t('notifications.send')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-cairo">{t('notifications.send')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="font-cairo">{t('notifications.to')}</Label>
                  <Select value={form.user_id} onValueChange={v => setForm(f => ({ ...f, user_id: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => (
                        <SelectItem key={e.user_id} value={e.user_id}>{e.name || 'بدون اسم'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="font-cairo">{t('title')}</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><Label className="font-cairo">{t('notifications.message')}</Label><Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-cairo">{t('cancel')}</Button>
                  <Button className="gradient-primary gap-1 font-cairo" onClick={handleSend}><Send className="h-4 w-4" /> {t('notifications.send')}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12 shadow-card text-center ramadan-card">
          <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground font-cairo">{t('notifications.noNotifications')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <Card key={n.id} className={`p-4 ramadan-card shadow-card transition-all ${!n.read ? 'border-l-4' : ''}`}
              style={!n.read ? { borderLeftColor: 'hsl(42 85% 50%)' } : {}}>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: n.read ? 'hsl(var(--muted))' : 'hsl(42 85% 50% / 0.15)' }}>
                  <Bell className="h-5 w-5" style={{ color: n.read ? 'hsl(var(--muted-foreground))' : 'hsl(42 85% 55%)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground font-cairo">{n.title}</p>
                  {n.message && <p className="text-sm text-muted-foreground font-cairo mt-1">{n.message}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString('ar-EG')}</p>
                </div>
                {!n.read && userRole !== 'admin' && (
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)} className="shrink-0 gap-1 font-cairo">
                    <Check className="h-3.5 w-3.5" /> {t('notifications.markRead')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
