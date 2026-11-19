import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CheckCircle, DollarSign, HandCoins } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Salary {
  id: string;
  user_id: string;
  amount: number;
  bonus: number;
  deductions: number;
  month: string;
  paid: boolean;
  notes: string;
  created_at: string;
  profile?: { name: string };
}

interface Advance {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  approved: boolean;
  created_at: string;
  profile?: { name: string };
}

interface Employee {
  user_id: string;
  name: string;
}

const SalariesPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [form, setForm] = useState({ user_id: '', amount: '', bonus: '0', deductions: '0', month: '', notes: '' });
  const [advanceForm, setAdvanceForm] = useState({ user_id: '', amount: '', reason: '' });

  const fetchData = async () => {
    // Fetch salaries
    let query = supabase.from('salaries').select('*').order('created_at', { ascending: false });
    if (userRole !== 'admin') query = query.eq('user_id', user?.id);
    const { data } = await query;

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
      setSalaries(data.map(d => ({ ...d, profile: profileMap[d.user_id] })));
    } else {
      setSalaries([]);
    }

    // Fetch advances
    let advQuery = supabase.from('salary_advances').select('*').order('created_at', { ascending: false });
    if (userRole !== 'admin') advQuery = advQuery.eq('user_id', user?.id);
    const { data: advData } = await advQuery;

    if (advData && advData.length > 0) {
      const userIds = [...new Set(advData.map(d => d.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
      setAdvances(advData.map(d => ({ ...d, profile: profileMap[d.user_id] })));
    } else {
      setAdvances([]);
    }

    // Fetch employees for admin
    if (userRole === 'admin') {
      const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'employee');
      if (roles?.length) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', roles.map(r => r.user_id));
        setEmployees(profiles || []);
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.user_id || !form.amount || !form.month) return;
    await supabase.from('salaries').insert({
      user_id: form.user_id,
      amount: Number(form.amount),
      bonus: Number(form.bonus),
      deductions: Number(form.deductions),
      month: form.month,
      notes: form.notes,
    });
    toast({ title: t('salaries.add') });
    setDialogOpen(false);
    setForm({ user_id: '', amount: '', bonus: '0', deductions: '0', month: '', notes: '' });
    fetchData();
  };

  const markPaid = async (id: string) => {
    await supabase.from('salaries').update({ paid: true }).eq('id', id);
    toast({ title: t('salaries.markPaid') });
    fetchData();
  };

  const handleAdvanceSave = async () => {
    const userId = userRole === 'admin' ? advanceForm.user_id : user?.id;
    if (!userId || !advanceForm.amount) return;
    await supabase.from('salary_advances').insert({
      user_id: userId,
      amount: Number(advanceForm.amount),
      reason: advanceForm.reason,
    });
    toast({ title: 'تم تسجيل الاستلاف ✅' });
    setAdvanceDialogOpen(false);
    setAdvanceForm({ user_id: '', amount: '', reason: '' });
    fetchData();
  };

  const approveAdvance = async (id: string) => {
    await supabase.from('salary_advances').update({ approved: true }).eq('id', id);
    toast({ title: 'تم الموافقة على الاستلاف ✅' });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-foreground font-cairo gold-text">{t('salaries.title')}</h1>
        <div className="flex gap-2 flex-wrap">
          {/* Advance Button */}
          <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1 font-cairo border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
                <HandCoins className="h-4 w-4" /> استلاف
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-cairo">طلب استلاف</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {userRole === 'admin' && (
                  <div>
                    <Label className="font-cairo">{t('salaries.employee')}</Label>
                    <Select value={advanceForm.user_id} onValueChange={v => setAdvanceForm(f => ({ ...f, user_id: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {employees.map(e => (
                          <SelectItem key={e.user_id} value={e.user_id}>{e.name || 'بدون اسم'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="font-cairo">المبلغ</Label>
                  <Input type="number" value={advanceForm.amount} onChange={e => setAdvanceForm(f => ({ ...f, amount: e.target.value }))} placeholder="مثلاً 200" />
                </div>
                <div>
                  <Label className="font-cairo">السبب</Label>
                  <Input value={advanceForm.reason} onChange={e => setAdvanceForm(f => ({ ...f, reason: e.target.value }))} placeholder="سبب الاستلاف (اختياري)" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setAdvanceDialogOpen(false)} className="font-cairo">{t('cancel')}</Button>
                  <Button className="gradient-primary font-cairo" onClick={handleAdvanceSave}>تسجيل</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {userRole === 'admin' && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary gap-1 font-cairo"><Plus className="h-4 w-4" /> {t('salaries.add')}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-cairo">{t('salaries.add')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="font-cairo">{t('salaries.employee')}</Label>
                    <Select value={form.user_id} onValueChange={v => setForm(f => ({ ...f, user_id: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {employees.map(e => (
                          <SelectItem key={e.user_id} value={e.user_id}>{e.name || 'بدون اسم'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="font-cairo">{t('salaries.amount')}</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                    <div><Label className="font-cairo">{t('salaries.bonus')}</Label><Input type="number" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} /></div>
                    <div><Label className="font-cairo">{t('salaries.deductions')}</Label><Input type="number" value={form.deductions} onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))} /></div>
                  </div>
                  <div><Label className="font-cairo">{t('salaries.month')}</Label><Input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} /></div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-cairo">{t('cancel')}</Button>
                    <Button className="gradient-primary font-cairo" onClick={handleSave}>{t('save')}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="salaries" className="w-full">
        <TabsList className="font-cairo">
          <TabsTrigger value="salaries" className="font-cairo gap-1"><DollarSign className="h-4 w-4" /> الرواتب</TabsTrigger>
          <TabsTrigger value="advances" className="font-cairo gap-1"><HandCoins className="h-4 w-4" /> الاستلافات</TabsTrigger>
        </TabsList>

        <TabsContent value="salaries">
          {salaries.length === 0 ? (
            <Card className="p-12 shadow-card text-center ramadan-card">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground font-cairo">{t('noData')}</p>
            </Card>
          ) : (
            <Card className="shadow-card ramadan-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('salaries.employee')}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('salaries.amount')}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('salaries.bonus')}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('salaries.deductions')}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('salaries.net')}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('salaries.month')}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('products.status')}</th>
                      {userRole === 'admin' && <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('actions')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map(s => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium font-cairo">{s.profile?.name || '-'}</td>
                        <td className="p-3 font-cairo">{s.amount.toLocaleString()} {t('currency')}</td>
                        <td className="p-3 font-cairo text-green-500">+{s.bonus.toLocaleString()}</td>
                        <td className="p-3 font-cairo text-red-500">-{s.deductions.toLocaleString()}</td>
                        <td className="p-3 font-bold font-cairo" style={{ color: 'hsl(42 70% 40%)' }}>
                          {(s.amount + s.bonus - s.deductions).toLocaleString()} {t('currency')}
                        </td>
                        <td className="p-3 font-cairo">{s.month}</td>
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold font-cairo ${
                            s.paid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {s.paid ? t('salaries.paid') : t('salaries.unpaid')}
                          </span>
                        </td>
                        {userRole === 'admin' && (
                          <td className="p-3">
                            {!s.paid && (
                              <Button size="sm" variant="outline" className="gap-1 font-cairo" onClick={() => markPaid(s.id)}>
                                <CheckCircle className="h-3.5 w-3.5" /> {t('salaries.markPaid')}
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="advances">
          {advances.length === 0 ? (
            <Card className="p-12 shadow-card text-center ramadan-card">
              <HandCoins className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground font-cairo">لا توجد استلافات</p>
            </Card>
          ) : (
            <Card className="shadow-card ramadan-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">الموظف</th>
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">المبلغ</th>
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">السبب</th>
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">التاريخ</th>
                      <th className="text-start p-3 font-medium text-muted-foreground font-cairo">الحالة</th>
                      {userRole === 'admin' && <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('actions')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {advances.map(a => (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium font-cairo">{a.profile?.name || '-'}</td>
                        <td className="p-3 font-cairo font-bold text-yellow-500">{a.amount.toLocaleString()} {t('currency')}</td>
                        <td className="p-3 font-cairo text-muted-foreground">{a.reason || '-'}</td>
                        <td className="p-3 font-cairo">{new Date(a.created_at).toLocaleDateString('ar-EG')}</td>
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold font-cairo ${
                            a.approved ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {a.approved ? 'تمت الموافقة' : 'في الانتظار'}
                          </span>
                        </td>
                        {userRole === 'admin' && (
                          <td className="p-3">
                            {!a.approved && (
                              <Button size="sm" variant="outline" className="gap-1 font-cairo" onClick={() => approveAdvance(a.id)}>
                                <CheckCircle className="h-3.5 w-3.5" /> موافقة
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalariesPage;
