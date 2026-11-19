import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Phone, ExternalLink, Shield, Trash2, UserPlus, Mail, Lock, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  user_id: string;
  name: string;
  phone: string;
  created_at: string;
  permissions: string[];
}

const ALL_PAGES = [
  'invoices', 'products', 'sales', 'purchases', 'inventory', 'warehouses',
  'customers', 'suppliers', 'crm', 'accounting', 'attendance', 'location',
  'expenses', 'salaries', 'tasks', 'notifications', 'bookings', 'reports', 'settings',
];

const EmployeesPage: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permChecks, setPermChecks] = useState<Record<string, boolean>>({});

  // Add employee dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Edit credentials dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchEmployees = async () => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'employee');

    if (!roles?.length) {
      setEmployees([]);
      return;
    }

    const userIds = roles.map(r => r.user_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, phone, created_at')
      .in('user_id', userIds);

    const { data: perms } = await supabase
      .from('employee_permissions')
      .select('user_id, page_key')
      .in('user_id', userIds);

    const empList: Employee[] = (profiles || []).map(p => ({
      user_id: p.user_id,
      name: p.name,
      phone: p.phone,
      created_at: p.created_at,
      permissions: (perms || []).filter(pm => pm.user_id === p.user_id).map(pm => pm.page_key),
    }));

    setEmployees(empList);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openPermissions = (emp: Employee) => {
    setSelectedEmployee(emp);
    const checks: Record<string, boolean> = {};
    ALL_PAGES.forEach(p => { checks[p] = emp.permissions.includes(p); });
    setPermChecks(checks);
    setDialogOpen(true);
  };

  const savePermissions = async () => {
    if (!selectedEmployee) return;

    await supabase
      .from('employee_permissions')
      .delete()
      .eq('user_id', selectedEmployee.user_id);

    const toInsert = ALL_PAGES.filter(p => permChecks[p]).map(page_key => ({
      user_id: selectedEmployee.user_id,
      page_key,
    }));

    if (toInsert.length > 0) {
      await supabase.from('employee_permissions').insert(toInsert);
    }

    toast({ title: t('employees.permissionsSaved') });
    setDialogOpen(false);
    fetchEmployees();
  };

  const deleteEmployee = async (userId: string) => {
    await supabase.from('employee_permissions').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);
    await supabase.from('user_roles').delete().eq('user_id', userId);
    toast({ title: t('employees.deleted'), variant: 'destructive' });
    fetchEmployees();
  };

  const addEmployee = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: 'يرجى إدخال الإيميل والباسورد', variant: 'destructive' });
      return;
    }
    setAddLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-employee', {
        body: { action: 'create', email: newEmail, password: newPassword, name: newName, phone: newPhone },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'تم إضافة الموظف بنجاح ✅' });
      setAddDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewPhone('');
      fetchEmployees();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
    setAddLoading(false);
  };

  const openEditCredentials = (emp: Employee) => {
    setEditEmployee(emp);
    setEditEmail('');
    setEditPassword('');
    setEditDialogOpen(true);
  };

  const updateCredentials = async () => {
    if (!editEmployee) return;
    if (!editEmail && !editPassword) {
      toast({ title: 'أدخل الإيميل أو الباسورد الجديد', variant: 'destructive' });
      return;
    }
    setEditLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-employee', {
        body: {
          action: 'update',
          userId: editEmployee.user_id,
          email: editEmail || undefined,
          password: editPassword || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'تم تحديث البيانات بنجاح ✅' });
      setEditDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
    setEditLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground font-cairo">{t('nav.employees')}</h1>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2 font-cairo">
          <UserPlus className="h-4 w-4" />
          إضافة موظف
        </Button>
      </div>

      {employees.length === 0 ? (
        <Card className="p-12 shadow-card text-center">
          <p className="text-muted-foreground font-cairo">{t('employees.noEmployees')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => (
            <Card key={emp.user_id} className="p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{emp.name || t('employees.noName')}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {emp.phone || '-'}
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-3">
                {t('employees.permissions')}: {emp.permissions.length > 0
                  ? emp.permissions.map(p => t(`nav.${p}`)).join(', ')
                  : t('employees.noPermissionsShort')}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openPermissions(emp)}>
                  <Shield className="h-3.5 w-3.5" /> {t('employees.managePermissions')}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => openEditCredentials(emp)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="gap-1" asChild>
                  <a href={`/employee-view/${emp.user_id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteEmployee(emp.user_id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Permissions Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">
              {t('employees.permissionsFor')} {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {ALL_PAGES.map(page => (
              <label key={page} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                <Checkbox
                  checked={permChecks[page] || false}
                  onCheckedChange={(checked) => setPermChecks(prev => ({ ...prev, [page]: !!checked }))}
                />
                <span className="text-sm font-medium">{t(`nav.${page}`)}</span>
              </label>
            ))}
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
              <Button onClick={savePermissions}>{t('save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">إضافة موظف جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-cairo font-medium flex items-center gap-1"><User className="h-3.5 w-3.5" /> الاسم</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم الموظف" className="font-cairo" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-cairo font-medium flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> الهاتف</label>
              <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="رقم الهاتف" className="font-cairo" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-cairo font-medium flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> الإيميل *</label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="employee@email.com" className="font-cairo" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-cairo font-medium flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> كلمة المرور *</label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="كلمة المرور" className="font-cairo" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>إلغاء</Button>
              <Button onClick={addEmployee} disabled={addLoading}>{addLoading ? '...' : 'إضافة'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Credentials Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">تعديل بيانات الدخول — {editEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-cairo font-medium flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> الإيميل الجديد</label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="اتركه فارغ لعدم التغيير" className="font-cairo" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-cairo font-medium flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> كلمة المرور الجديدة</label>
              <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="اتركها فارغة لعدم التغيير" className="font-cairo" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>إلغاء</Button>
              <Button onClick={updateCredentials} disabled={editLoading}>{editLoading ? '...' : 'حفظ'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesPage;
