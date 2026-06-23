import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface MonthlyData {
  salary: number;
  loan: number;
  deduction: number;
}

interface Employee {
  id: string;
  name: string;
  monthlyData: Record<string, MonthlyData>; // keyed by YYYY-MM
}

const STORAGE_KEY = 'amber_employees';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Migrate old flat format to new monthly format
const loadEmployees = (): Employee[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return raw.map((e: any) => {
      if (e.monthlyData) return e; // already new format
      // Migrate: old format had salary/loan/deduction at top level
      const month = getCurrentMonth();
      return {
        id: e.id,
        name: e.name,
        monthlyData: {
          [month]: { salary: e.salary || 0, loan: e.loan || 0, deduction: e.deduction || 0 }
        }
      };
    });
  } catch { return []; }
};

const saveEmployees = (data: Employee[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const Employees = () => {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<Employee[]>(loadEmployees);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');
  const [loan, setLoan] = useState('');
  const [deduction, setDeduction] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', salary: '', loan: '', deduction: '' });

  useEffect(() => { saveEmployees(entries); }, [entries]);

  const getMonthData = (emp: Employee): MonthlyData => {
    return emp.monthlyData[selectedMonth] || { salary: 0, loan: 0, deduction: 0 };
  };

  const handleSave = () => {
    const s = parseFloat(salary);
    if (!name.trim() || isNaN(s) || s <= 0) {
      toast.error(t('employees.validationError'));
      return;
    }
    const existing = entries.find(e => e.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      // Update monthly data for existing employee
      setEntries(prev => prev.map(e => e.id === existing.id ? {
        ...e,
        monthlyData: {
          ...e.monthlyData,
          [selectedMonth]: { salary: s, loan: parseFloat(loan) || 0, deduction: parseFloat(deduction) || 0 }
        }
      } : e));
    } else {
      const newEntry: Employee = {
        id: crypto.randomUUID(),
        name: name.trim(),
        monthlyData: {
          [selectedMonth]: { salary: s, loan: parseFloat(loan) || 0, deduction: parseFloat(deduction) || 0 }
        }
      };
      setEntries(prev => [newEntry, ...prev]);
    }
    setName(''); setSalary(''); setLoan(''); setDeduction('');
    toast.success(t('employees.saved'));
  };

  const startEdit = (emp: Employee) => {
    const data = getMonthData(emp);
    setEditingId(emp.id);
    setEditForm({ name: emp.name, salary: String(data.salary), loan: String(data.loan), deduction: String(data.deduction) });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: string) => {
    const s = parseFloat(editForm.salary);
    if (!editForm.name.trim() || isNaN(s) || s <= 0) {
      toast.error(t('employees.validationError'));
      return;
    }
    setEntries(prev => prev.map(e => e.id === id ? {
      ...e,
      name: editForm.name.trim(),
      monthlyData: {
        ...e.monthlyData,
        [selectedMonth]: { salary: s, loan: parseFloat(editForm.loan) || 0, deduction: parseFloat(editForm.deduction) || 0 }
      }
    } : e));
    setEditingId(null);
    toast.success(t('employees.saved'));
  };

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm'))) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const getMonthLabel = (month: string) => {
    const [y, m] = month.split('-');
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString(locale, { year: 'numeric', month: 'long' });
  };

  // Only show employees that have data for selected month OR all employees
  const visibleEntries = entries;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <Label>{t('employees.month')}</Label>
        <Input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="w-auto"
        />
        <span className="text-sm text-muted-foreground">{getMonthLabel(selectedMonth)}</span>
      </div>

      <div className="mx-auto max-w-lg rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-xl font-bold">{t('employees.title')}</h2>
        <div className="space-y-1.5">
          <Label>{t('employees.name')}</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>{t('employees.salary')}</Label>
            <Input type="number" min="0" value={salary} onChange={e => setSalary(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('employees.loan')}</Label>
            <Input type="number" min="0" value={loan} onChange={e => setLoan(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('employees.deduction')}</Label>
            <Input type="number" min="0" value={deduction} onChange={e => setDeduction(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSave} className="w-full">{t('employees.save')}</Button>
      </div>

      {visibleEntries.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t('employees.noEntries')}</p>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('employees.name')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('employees.salary')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('employees.loan')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('employees.deduction')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('employees.netSalary')}</th>
                <th className="px-4 py-3 text-end font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map(emp => {
                const isEditing = editingId === emp.id;
                const data = getMonthData(emp);
                const editS = parseFloat(editForm.salary) || 0;
                const editL = parseFloat(editForm.loan) || 0;
                const editD = parseFloat(editForm.deduction) || 0;
                return (
                <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {isEditing ? <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="h-8 w-32" /> : emp.name}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? <Input type="number" min="0" value={editForm.salary} onChange={e => setEditForm(f => ({ ...f, salary: e.target.value }))} className="h-8 w-24" /> : `$${data.salary.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? <Input type="number" min="0" value={editForm.loan} onChange={e => setEditForm(f => ({ ...f, loan: e.target.value }))} className="h-8 w-24" /> : `$${data.loan.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? <Input type="number" min="0" value={editForm.deduction} onChange={e => setEditForm(f => ({ ...f, deduction: e.target.value }))} className="h-8 w-24" /> : `$${data.deduction.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 font-bold">${(isEditing ? editS - editL - editD : data.salary - data.loan - data.deduction).toFixed(2)}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => saveEdit(emp.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEdit}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(emp)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(emp.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Employees;
