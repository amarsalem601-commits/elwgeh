import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface Task {
  id: string;
  assigned_to: string;
  assigned_by: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  profile?: { name: string };
}

interface Employee {
  user_id: string;
  name: string;
}

const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-red-500/20 text-red-400',
};

const statusIcons: Record<string, React.FC<{ className?: string }>> = {
  pending: Clock,
  in_progress: AlertTriangle,
  completed: CheckCircle,
};

const TasksPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ assigned_to: '', title: '', description: '', priority: 'medium', due_date: '' });

  const fetchData = async () => {
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (userRole !== 'admin') query = query.eq('assigned_to', user?.id);
    const { data } = await query;

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(d => d.assigned_to))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
      setTasks(data.map(d => ({ ...d, profile: profileMap[d.assigned_to] })));
    } else {
      setTasks([]);
    }

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
    if (!form.assigned_to || !form.title || !user) return;
    await supabase.from('tasks').insert({
      assigned_to: form.assigned_to,
      assigned_by: user.id,
      title: form.title,
      description: form.description,
      priority: form.priority,
      due_date: form.due_date || null,
    });
    toast({ title: t('tasks.add') });
    setDialogOpen(false);
    setForm({ assigned_to: '', title: '', description: '', priority: 'medium', due_date: '' });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('tasks').update({ status }).eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground font-cairo gold-text">{t('tasks.title')}</h1>
        {userRole === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-1 font-cairo"><Plus className="h-4 w-4" /> {t('tasks.add')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-cairo">{t('tasks.add')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="font-cairo">{t('tasks.assignTo')}</Label>
                  <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => (
                        <SelectItem key={e.user_id} value={e.user_id}>{e.name || 'بدون اسم'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="font-cairo">{t('title')}</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><Label className="font-cairo">{t('tasks.description')}</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-cairo">{t('tasks.priority')}</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('tasks.low')}</SelectItem>
                        <SelectItem value="medium">{t('tasks.medium')}</SelectItem>
                        <SelectItem value="high">{t('tasks.high')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="font-cairo">{t('tasks.dueDate')}</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-cairo">{t('cancel')}</Button>
                  <Button className="gradient-primary font-cairo" onClick={handleSave}>{t('save')}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {tasks.length === 0 ? (
        <Card className="p-12 shadow-card text-center ramadan-card">
          <p className="text-muted-foreground font-cairo">{t('noData')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => {
            const StatusIcon = statusIcons[task.status] || Clock;
            return (
              <Card key={task.id} className="p-5 ramadan-card shadow-card hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-foreground font-cairo">{task.title}</h3>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold font-cairo ${priorityColors[task.priority]}`}>
                    {t(`tasks.${task.priority}`)}
                  </span>
                </div>
                {task.description && <p className="text-sm text-muted-foreground mb-3 font-cairo">{task.description}</p>}
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground font-cairo">
                  <StatusIcon className="h-3.5 w-3.5" />
                  {t(`tasks.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}
                  {task.profile && <span className="ms-auto">← {task.profile.name}</span>}
                </div>
                {task.due_date && (
                  <p className="text-xs text-muted-foreground font-cairo mb-3">
                    {t('tasks.dueDate')}: {new Date(task.due_date).toLocaleDateString('ar-EG')}
                  </p>
                )}
                {/* Status controls */}
                <div className="flex gap-1">
                  {['pending', 'in_progress', 'completed'].map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={task.status === s ? 'default' : 'outline'}
                      className={`flex-1 text-xs font-cairo ${task.status === s ? 'gradient-primary' : ''}`}
                      onClick={() => updateStatus(task.id, s)}
                    >
                      {t(`tasks.${s === 'in_progress' ? 'inProgress' : s}`)}
                    </Button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
