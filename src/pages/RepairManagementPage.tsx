import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Car, Phone, User, Calendar, MessageCircle, Wrench, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  car_type: string;
  car_model: string;
  problem_description: string;
  appointment_date: string | null;
  status: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  booking_id: string;
  role: string;
  content: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, Record<string, string>> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  in_progress: { ar: 'جاري الإصلاح', en: 'In Progress' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

const RepairManagementPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('repair_bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setBookings(data);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const viewChat = async (booking: Booking) => {
    setSelectedBooking(booking);
    const { data } = await supabase
      .from('repair_chat_messages')
      .select('*')
      .eq('booking_id', booking.id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
    setChatOpen(true);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('repair_bookings')
      .update({ status })
      .eq('id', id);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: lang === 'ar' ? 'تم تحديث الحالة' : 'Status updated' });
      fetchBookings();
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-cairo gold-text flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          {lang === 'ar' ? 'إدارة حجوزات الإصلاح' : 'Repair Bookings Management'}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: lang === 'ar' ? 'إجمالي الحجوزات' : 'Total', value: stats.total, icon: Car, color: 'text-primary' },
          { label: lang === 'ar' ? 'قيد الانتظار' : 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
          { label: lang === 'ar' ? 'جاري الإصلاح' : 'In Progress', value: stats.in_progress, icon: Wrench, color: 'text-purple-500' },
          { label: lang === 'ar' ? 'مكتمل' : 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-500' },
        ].map((s, i) => (
          <Card key={i} className="border-primary/10">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground font-cairo">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : bookings.length === 0 ? (
        <Card className="border-primary/10 text-center py-12">
          <CardContent>
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-cairo">{lang === 'ar' ? 'لا توجد حجوزات بعد' : 'No bookings yet'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map(booking => (
            <Card key={booking.id} className="border-primary/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-bold font-cairo">{booking.customer_name}</span>
                      <Badge className={statusColors[booking.status] || statusColors.pending}>
                        {statusLabels[booking.status]?.[lang] || booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{booking.customer_phone}</span>
                      {booking.car_type && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{booking.car_type} {booking.car_model}</span>}
                      {booking.appointment_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(booking.appointment_date).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>
                      )}
                    </div>
                    {booking.problem_description && (
                      <p className="text-sm text-muted-foreground font-cairo line-clamp-2">{booking.problem_description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={booking.status} onValueChange={val => updateStatus(booking.id, val)}>
                      <SelectTrigger className="w-[140px] text-xs font-cairo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, labels]) => (
                          <SelectItem key={key} value={key} className="font-cairo text-xs">{labels[lang]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => viewChat(booking)} className="gap-1 font-cairo">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {lang === 'ar' ? 'الشات' : 'Chat'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="font-cairo flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              {lang === 'ar' ? 'محادثة العميل' : 'Customer Chat'} — {selectedBooking?.customer_name}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[400px] overflow-y-auto space-y-3 p-2">
            {chatMessages.length === 0 ? (
              <p className="text-center text-muted-foreground font-cairo py-8">{lang === 'ar' ? 'لا توجد رسائل' : 'No messages'}</p>
            ) : chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm font-cairo whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepairManagementPage;
