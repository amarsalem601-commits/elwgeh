import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Database, RefreshCw, Pencil, Trash2, Save, ShieldCheck, User as UserIcon, Search } from 'lucide-react';

const TABLE_NAMES = [
  'profiles', 'user_roles', 'employee_permissions', 'invoices', 'invoice_items',
  'expenses', 'salaries', 'salary_advances', 'attendance', 'location_tracking',
  'tasks', 'notifications', 'crm_leads', 'crm_activities', 'accounting_entries',
  'warehouses', 'warehouse_stock', 'warehouse_transfers',
  'repair_bookings', 'repair_chat_messages', 'repair_page_settings',
  'team_members',
] as const;

type TableName = typeof TABLE_NAMES[number];

const NON_EDITABLE_COLS = new Set(['id', 'created_at', 'updated_at', 'user_id']);

const DatabaseViewerPage: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAr = lang === 'ar';

  const [activeTable, setActiveTable] = useState<TableName>('profiles');
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [deleting, setDeleting] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Record<string, 'admin' | 'employee'>>({});

  const fetchTableData = async (tableName: TableName) => {
    setLoading(true);
    setActiveTable(tableName);
    setSearch('');
    const orderCol = tableName === 'repair_page_settings' ? 'updated_at' : 'created_at';
    const { data: rows } = await supabase
      .from(tableName)
      .select('*')
      .order(orderCol, { ascending: false })
      .limit(200);

    if (rows && rows.length > 0) {
      setColumns(Object.keys(rows[0]));
      setData(rows);
    } else {
      setColumns([]);
      setData([]);
    }

    if (tableName === 'profiles') {
      const { data: rs } = await supabase.from('user_roles').select('user_id, role');
      const map: Record<string, 'admin' | 'employee'> = {};
      rs?.forEach((r: any) => { map[r.user_id] = r.role; });
      setRoles(map);
    }
    setLoading(false);
  };

  const fetchCounts = async () => {
    const results: Record<string, number> = {};
    await Promise.all(
      TABLE_NAMES.map(async (t) => {
        const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
        results[t] = count || 0;
      })
    );
    setCounts(results);
  };

  useEffect(() => {
    fetchCounts();
    fetchTableData('profiles');
  }, []);

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? '✅' : '❌';
    if (typeof val === 'object') return JSON.stringify(val);
    const s = String(val);
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  };

  const openEdit = (row: any) => {
    setEditing(row);
    const form: Record<string, any> = {};
    columns.forEach((c) => {
      if (!NON_EDITABLE_COLS.has(c)) form[c] = row[c];
    });
    setEditForm(form);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from(activeTable).update(editForm).eq('id', editing.id);
    if (error) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isAr ? 'تم الحفظ ✅' : 'Saved ✅' });
      setEditing(null);
      fetchTableData(activeTable);
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);

    if (activeTable === 'profiles') {
      // Delete via edge function (auth user + cascades)
      const res = await supabase.functions.invoke('manage-employee', {
        body: { action: 'delete', userId: deleting.user_id },
      });
      if (res.error) {
        toast({ title: isAr ? 'خطأ' : 'Error', description: res.error.message, variant: 'destructive' });
      } else {
        toast({ title: isAr ? 'تم الحذف ✅' : 'Deleted ✅' });
        fetchTableData(activeTable);
        fetchCounts();
      }
    } else {
      const { error } = await supabase.from(activeTable).delete().eq('id', deleting.id);
      if (error) {
        toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: isAr ? 'تم الحذف ✅' : 'Deleted ✅' });
        fetchTableData(activeTable);
        fetchCounts();
      }
    }
    setDeleting(null);
    setSaving(false);
  };

  const changeRole = async (userId: string, role: 'admin' | 'employee') => {
    if (userId === user?.id) {
      toast({ title: isAr ? 'لا يمكن تغيير دورك الخاص' : 'Cannot change your own role', variant: 'destructive' });
      return;
    }
    const res = await supabase.functions.invoke('manage-employee', {
      body: { action: 'set_role', userId, role },
    });
    if (res.error) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: res.error.message, variant: 'destructive' });
    } else {
      toast({ title: isAr ? `تم التعيين كـ ${role === 'admin' ? 'مدير' : 'موظف'} ✅` : `Set as ${role} ✅` });
      setRoles({ ...roles, [userId]: role });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((c) => String(row[c] ?? '').toLowerCase().includes(q))
    );
  }, [data, columns, search]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            {isAr ? 'قاعدة البيانات' : 'Database'}
          </h1>
          <p className="text-xs text-muted-foreground font-cairo mt-1">
            {isAr
              ? 'تصفح وعدّل واحذف أي سجل في قاعدة البيانات'
              : 'Browse, edit, and delete any record in the database'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchCounts(); fetchTableData(activeTable); }} className="gap-1 font-cairo">
          <RefreshCw className="h-4 w-4" /> {isAr ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Table selector chips */}
      <Card className="p-3">
        <p className="text-[11px] font-cairo text-muted-foreground mb-2">
          {isAr ? `الجداول (${TABLE_NAMES.length})` : `Tables (${TABLE_NAMES.length})`}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TABLE_NAMES.map((t) => {
            const isActive = activeTable === t;
            return (
              <button
                key={t}
                onClick={() => fetchTableData(t)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all gap-1 inline-flex items-center
                  ${isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border hover:border-primary/50 text-foreground'}`}
              >
                {t}
                <span className={`rounded-full px-1.5 text-[10px] font-bold ${isActive ? 'bg-primary-foreground/25' : 'bg-primary/15 text-primary'}`}>
                  {counts[t] ?? '…'}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} h-4 w-4 text-muted-foreground`} />
          <Input
            placeholder={isAr ? 'بحث في النتائج...' : 'Search results...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${isAr ? 'pr-10' : 'pl-10'} h-9 font-cairo text-sm`}
          />
        </div>
        <Badge variant="secondary" className="font-mono text-[11px]">
          {filtered.length} / {data.length}
        </Badge>
      </div>

      {/* Data table */}
      <Card className="overflow-hidden border-border">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-cairo">
            {isAr ? 'لا توجد بيانات' : 'No data'}
          </div>
        ) : (
          <div
            className="overflow-auto max-h-[60vh] resize-y"
            style={{ scrollbarWidth: 'auto', scrollbarColor: 'hsl(var(--primary)) hsl(var(--muted))' }}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                <TableRow className="hover:bg-card">
                  <TableHead className="font-cairo text-xs w-10 bg-card">#</TableHead>
                  {activeTable === 'profiles' && (
                    <TableHead className="font-cairo text-xs bg-card">{isAr ? 'الدور' : 'Role'}</TableHead>
                  )}
                  {columns.map((col) => (
                    <TableHead key={col} className="font-mono text-[11px] whitespace-nowrap bg-card text-primary">
                      {col}
                    </TableHead>
                  ))}
                  <TableHead className="font-cairo text-xs text-right whitespace-nowrap bg-card sticky right-0">
                    {isAr ? 'الإجراءات' : 'Actions'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, i) => {
                  const userIdField = row.user_id;
                  const currentRole = roles[userIdField];
                  return (
                    <TableRow key={row.id || i} className="hover:bg-muted/40">
                      <TableCell className="text-xs text-muted-foreground font-mono">{i + 1}</TableCell>

                      {activeTable === 'profiles' && (
                        <TableCell>
                          <Select
                            value={currentRole || 'employee'}
                            onValueChange={(v) => changeRole(userIdField, v as 'admin' | 'employee')}
                          >
                            <SelectTrigger className="h-7 text-xs w-28 font-cairo">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin" className="text-xs">
                                <span className="flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" /> {isAr ? 'مدير' : 'Admin'}
                                </span>
                              </SelectItem>
                              <SelectItem value="employee" className="text-xs">
                                <span className="flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" /> {isAr ? 'موظف' : 'Employee'}
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}

                      {columns.map((col) => (
                        <TableCell key={col} className="text-xs whitespace-nowrap max-w-[220px] truncate font-mono">
                          {formatValue(row[col])}
                        </TableCell>
                      ))}

                      <TableCell className="whitespace-nowrap sticky right-0 bg-card">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => openEdit(row)}
                            className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                            title={isAr ? 'تعديل' : 'Edit'}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => setDeleting(row)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-red-50 dark:hover:bg-red-950"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground font-cairo flex items-center justify-between">
          <span>{isAr ? `عرض ${filtered.length} صف (الحد الأقصى 200)` : `Showing ${filtered.length} rows (max 200)`}</span>
          <span className="font-mono text-primary">{activeTable}</span>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              {isAr ? 'تعديل سجل' : 'Edit Record'}
              <span className="font-mono text-xs text-muted-foreground">({activeTable})</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {Object.keys(editForm).map((col) => {
              const val = editForm[col];
              const isLong = typeof val === 'string' && val.length > 60;
              const isBool = typeof val === 'boolean';
              const isNum = typeof val === 'number';
              return (
                <div key={col} className="space-y-1">
                  <label className="text-[11px] font-mono text-primary">{col}</label>
                  {isBool ? (
                    <Select
                      value={String(val)}
                      onValueChange={(v) => setEditForm({ ...editForm, [col]: v === 'true' })}
                    >
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">true</SelectItem>
                        <SelectItem value="false">false</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : isLong ? (
                    <Textarea
                      value={val ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, [col]: e.target.value })}
                      rows={3}
                      className="text-sm font-mono"
                    />
                  ) : (
                    <Input
                      type={isNum ? 'number' : 'text'}
                      value={val ?? ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        [col]: isNum ? parseFloat(e.target.value) || 0 : e.target.value,
                      })}
                      className="h-9 text-sm font-mono"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving} className="font-cairo">
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={saveEdit} disabled={saving} className="gap-1 font-cairo">
              <Save className="h-4 w-4" /> {saving ? '...' : (isAr ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo">
              {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">
              {isAr
                ? `هل أنت متأكد من حذف هذا السجل من جدول "${activeTable}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete this record from "${activeTable}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-cairo">{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-cairo"
            >
              {saving ? '...' : (isAr ? 'حذف' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DatabaseViewerPage;
