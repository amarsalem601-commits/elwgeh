import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Phone, Mail, Building, DollarSign, MessageSquare } from 'lucide-react';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  qualified: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  proposal: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  won: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};
const statusLabels: Record<string, Record<string, string>> = {
  new: { ar: 'جديد', en: 'New' },
  contacted: { ar: 'تم التواصل', en: 'Contacted' },
  qualified: { ar: 'مؤهل', en: 'Qualified' },
  proposal: { ar: 'عرض سعر', en: 'Proposal' },
  won: { ar: 'تم البيع', en: 'Won' },
  lost: { ar: 'خسارة', en: 'Lost' },
};

const CRMPage: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', source: 'direct', value: 0, notes: '' });
  const [activityForm, setActivityForm] = useState({ type: 'note', content: '' });

  const fetchLeads = async () => {
    const { data } = await supabase.from('crm_leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const addLead = async () => {
    if (!form.name || !form.phone) { toast({ title: lang === 'ar' ? 'أكمل البيانات' : 'Fill required fields', variant: 'destructive' }); return; }
    const { error } = await supabase.from('crm_leads').insert({ ...form, created_by: user?.id || '' });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: lang === 'ar' ? 'تم إضافة العميل المحتمل' : 'Lead added' });
    setOpen(false); setForm({ name: '', phone: '', email: '', company: '', source: 'direct', value: 0, notes: '' }); fetchLeads();
  };

  const updateLeadStatus = async (id: string, status: string) => {
    await supabase.from('crm_leads').update({ status }).eq('id', id);
    fetchLeads();
  };

  const openActivities = async (lead: any) => {
    setSelectedLead(lead);
    const { data } = await supabase.from('crm_activities').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });
    if (data) setActivities(data);
    setActivityOpen(true);
  };

  const addActivity = async () => {
    if (!activityForm.content || !selectedLead) return;
    await supabase.from('crm_activities').insert({ lead_id: selectedLead.id, ...activityForm, created_by: user?.id || '' });
    const { data } = await supabase.from('crm_activities').select('*').eq('lead_id', selectedLead.id).order('created_at', { ascending: false });
    if (data) setActivities(data);
    setActivityForm({ type: 'note', content: '' });
    toast({ title: lang === 'ar' ? 'تمت الإضافة' : 'Added' });
  };

  const totalValue = leads.filter(l => l.status === 'won').reduce((s, l) => s + l.value, 0);
  const pipelineValue = leads.filter(l => !['won', 'lost'].includes(l.status)).reduce((s, l) => s + l.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-cairo gold-text flex items-center gap-2">
          <Users className="h-6 w-6" />
          {lang === 'ar' ? 'إدارة العملاء المحتملين (CRM)' : 'CRM - Lead Management'}
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2 font-cairo"><Plus className="h-4 w-4" />{lang === 'ar' ? 'عميل جديد' : 'New Lead'}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-cairo">{lang === 'ar' ? 'إضافة عميل محتمل' : 'Add Lead'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={lang === 'ar' ? 'الاسم *' : 'Name *'} className="font-cairo" />
              <div className="grid grid-cols-2 gap-3">
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder={lang === 'ar' ? 'الهاتف *' : 'Phone *'} className="font-cairo" />
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={lang === 'ar' ? 'الإيميل' : 'Email'} className="font-cairo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder={lang === 'ar' ? 'الشركة' : 'Company'} className="font-cairo" />
                <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: +e.target.value }))} placeholder={lang === 'ar' ? 'القيمة المتوقعة' : 'Expected Value'} className="font-cairo" />
              </div>
              <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                <SelectTrigger className="font-cairo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[{ v: 'direct', ar: 'مباشر', en: 'Direct' }, { v: 'referral', ar: 'إحالة', en: 'Referral' }, { v: 'website', ar: 'الموقع', en: 'Website' }, { v: 'social', ar: 'سوشيال ميديا', en: 'Social Media' }].map(s => (
                    <SelectItem key={s.v} value={s.v} className="font-cairo">{lang === 'ar' ? s.ar : s.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={lang === 'ar' ? 'ملاحظات' : 'Notes'} className="font-cairo" />
              <Button onClick={addLead} className="w-full font-cairo">{lang === 'ar' ? 'إضافة' : 'Add'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/10"><CardContent className="p-4"><p className="text-2xl font-bold">{leads.length}</p><p className="text-xs text-muted-foreground font-cairo">{lang === 'ar' ? 'إجمالي العملاء' : 'Total Leads'}</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-4"><p className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'won').length}</p><p className="text-xs text-muted-foreground font-cairo">{lang === 'ar' ? 'صفقات ناجحة' : 'Won'}</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-4"><p className="text-2xl font-bold gold-text">{pipelineValue.toFixed(0)}</p><p className="text-xs text-muted-foreground font-cairo">{lang === 'ar' ? 'قيمة الأنبوب' : 'Pipeline Value'}</p></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-4"><p className="text-2xl font-bold text-green-600">{totalValue.toFixed(0)}</p><p className="text-xs text-muted-foreground font-cairo">{lang === 'ar' ? 'قيمة المحققة' : 'Won Value'}</p></CardContent></Card>
      </div>

      {/* Leads */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : leads.length === 0 ? (
        <Card className="text-center py-12 border-primary/10"><CardContent><Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground font-cairo">{lang === 'ar' ? 'لا توجد عملاء محتملين' : 'No leads'}</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {leads.map(lead => (
            <Card key={lead.id} className="border-primary/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold font-cairo">{lead.name}</span>
                    <Badge className={statusColors[lead.status] || 'bg-muted'}>{statusLabels[lead.status]?.[lang] || lead.status}</Badge>
                    {lead.value > 0 && <Badge variant="outline" className="font-cairo"><DollarSign className="h-3 w-3" />{lead.value}</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                    {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                    {lead.company && <span className="flex items-center gap-1"><Building className="h-3 w-3" />{lead.company}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={lead.status} onValueChange={v => updateLeadStatus(lead.id, v)}>
                    <SelectTrigger className="w-[120px] text-xs font-cairo"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k} className="font-cairo text-xs">{v[lang]}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => openActivities(lead)} className="gap-1 font-cairo"><MessageSquare className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Activities Dialog */}
      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader><DialogTitle className="font-cairo">{lang === 'ar' ? 'نشاطات' : 'Activities'} — {selectedLead?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select value={activityForm.type} onValueChange={v => setActivityForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="w-[100px] font-cairo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note" className="font-cairo">{lang === 'ar' ? 'ملاحظة' : 'Note'}</SelectItem>
                  <SelectItem value="call" className="font-cairo">{lang === 'ar' ? 'مكالمة' : 'Call'}</SelectItem>
                  <SelectItem value="meeting" className="font-cairo">{lang === 'ar' ? 'اجتماع' : 'Meeting'}</SelectItem>
                </SelectContent>
              </Select>
              <Input value={activityForm.content} onChange={e => setActivityForm(f => ({ ...f, content: e.target.value }))} placeholder={lang === 'ar' ? 'اكتب هنا...' : 'Write here...'} className="font-cairo flex-1" />
              <Button onClick={addActivity} size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {activities.map(a => (
                <div key={a.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{a.type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                  </div>
                  <p className="text-sm font-cairo">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMPage;
