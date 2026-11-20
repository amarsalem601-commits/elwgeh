import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, BellRing, Send, Check, Plus, Inbox } from 'lucide-react';
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
  const { t, lang } = useLanguage();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ user_id: '', title: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (userRole !== 'admin') query = query.eq('user_id', user?.id);
    const { data } = await query;
    setNotifications(data || []);
    setLoading(false);

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
    if (!form.user_id || !form.title.trim()) {
      toast({
        title: lang === 'ar' ? 'أكمل بيانات الإشعار' : 'Complete the notification',
        description: lang === 'ar' ? 'اختر الموظف وأدخل عنوان الإشعار.' : 'Choose an employee and enter a title.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    const { error } = await supabase.from('notifications').insert({
      user_id: form.user_id,
      title: form.title.trim(),
      message: form.message.trim(),
    });
    setSending(false);

    if (error) {
      toast({
        title: lang === 'ar' ? 'تعذر إرسال الإشعار' : 'Could not send notification',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: lang === 'ar' ? 'تم إرسال الإشعار بنجاح' : 'Notification sent successfully',
    });
    setDialogOpen(false);
    setForm({ user_id: '', title: '', message: '' });
    await fetchData();
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
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-cairo" disabled={sending}>{t('cancel')}</Button>
                  <Button className="gradient-primary gap-1 font-cairo" onClick={handleSend} disabled={sending}>
                    <Send className="h-4 w-4" />
                    {sending
                      ? (lang === 'ar' ? 'جارٍ الإرسال...' : 'Sending...')
                      : t('notifications.send')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <Card className="min-h-64 p-8 shadow-card ramadan-card">
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="relative min-h-64 overflow-hidden p-8 text-center shadow-card ramadan-card">
          <div className="absolute inset-x-0 top-0 h-1 gradient-primary" />
          <div className="flex min-h-48 flex-col items-center justify-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 scale-150 rounded-full bg-primary/5" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary">
                <BellRing className="h-8 w-8" />
              </div>
            </div>
            <h2 className="font-cairo text-lg font-bold text-foreground">
              {lang === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
            </h2>
            <p className="mt-2 max-w-md font-cairo text-sm text-muted-foreground">
              {lang === 'ar'
                ? 'أنت على اطلاع كامل؛ ستظهر التحديثات والتنبيهات المهمة هنا.'
                : 'You are all caught up. Important updates and alerts will appear here.'}
            </p>
            {userRole === 'admin' && (
              <Button
                className="gradient-primary mt-5 gap-2 font-cairo"
                onClick={() => setDialogOpen(true)}
              >
                <Inbox className="h-4 w-4" />
                {lang === 'ar' ? 'إرسال أول إشعار' : 'Send the first notification'}
              </Button>
            )}
          </div>
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
