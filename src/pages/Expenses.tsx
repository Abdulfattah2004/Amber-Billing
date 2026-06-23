import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseEntry {
  id: string;
  amount: number;
  type: string;
  date: string;
}

const STORAGE_KEY = 'amber_expenses';

const loadExpenses = (): ExpenseEntry[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const saveExpenses = (data: ExpenseEntry[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const Expenses = () => {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<ExpenseEntry[]>(loadExpenses);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => { saveExpenses(entries); }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [entries, selectedMonth]);

  const handleSave = () => {
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0 || !type.trim()) {
      toast.error(t('expenses.validationError'));
      return;
    }
    const newEntry: ExpenseEntry = {
      id: crypto.randomUUID(),
      amount: a,
      type: type.trim(),
      date: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
    setAmount(''); setType('');
    toast.success(t('expenses.saved'));
  };

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm'))) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mx-auto max-w-lg rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-xl font-bold">{t('expenses.title')}</h2>
        <div>
          <Label>{t('expenses.month')}</Label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-auto mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t('expenses.amount')}</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('expenses.type')}</Label>
            <Input value={type} onChange={e => setType(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSave} className="w-full">{t('expenses.save')}</Button>
      </div>

      {filteredEntries.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t('expenses.noEntries')}</p>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('expenses.amount')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('expenses.type')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('expenses.date')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('expenses.time')}</th>
                <th className="px-4 py-3 text-end font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(exp => {
                const d = new Date(exp.date);
                return (
                  <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-bold">${exp.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">{exp.type}</td>
                    <td className="px-4 py-3">{d.toLocaleDateString(locale)}</td>
                    <td className="px-4 py-3">{d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-3 text-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(exp.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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

export default Expenses;