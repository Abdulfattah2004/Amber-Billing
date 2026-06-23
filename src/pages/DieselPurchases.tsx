import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Fuel, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface DieselEntry {
  id: string;
  liters: number;
  priceUsd: number;
  date: string; // ISO string
}

const STORAGE_KEY = 'diesel_purchases';

const loadEntries = (): DieselEntry[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const saveEntries = (entries: DieselEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const DieselPurchases = () => {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<DieselEntry[]>(loadEntries);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [liters, setLiters] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ liters: '', price: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseFloat(liters);
    const p = parseFloat(price);
    if (!l || l <= 0 || !p || p <= 0) {
      toast.error(t('diesel.validationError'));
      return;
    }
    const newEntry: DieselEntry = {
      id: crypto.randomUUID(),
      liters: l,
      priceUsd: p,
      date: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setLiters('');
    setPrice('');
    toast.success(t('diesel.saved'));
  };

  const startEdit = (entry: DieselEntry) => {
    setEditingId(entry.id);
    setEditForm({ liters: String(entry.liters), price: String(entry.priceUsd) });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: string) => {
    const l = parseFloat(editForm.liters);
    const p = parseFloat(editForm.price);
    if (!l || l <= 0 || !p || p <= 0) {
      toast.error(t('diesel.validationError'));
      return;
    }
    const updated = entries.map(e => e.id === id ? { ...e, liters: l, priceUsd: p } : e);
    setEntries(updated);
    saveEntries(updated);
    setEditingId(null);
    toast.success(t('diesel.updated'));
  };

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm'))) {
      const updated = entries.filter(e => e.id !== id);
      setEntries(updated);
      saveEntries(updated);
      toast.success(t('diesel.deleted'));
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getMonthKey = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthLabel = (monthKey: string) => {
    const [y, m] = monthKey.split('-');
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString(locale, { year: 'numeric', month: 'long' });
  };

  // Filter entries by selected month, then group
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => getMonthKey(entry.date) === selectedMonth);
  }, [entries, selectedMonth]);

  const groupedByMonth = useMemo(() => {
    const map = new Map<string, DieselEntry[]>();
    filteredEntries.forEach(entry => {
      const key = getMonthKey(entry.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredEntries]);

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <Input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Fuel className="h-5 w-5 text-primary" />
          {t('diesel.addEntry')}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('diesel.liters')}</label>
            <Input
              type="number"
              step="any"
              min="0.01"
              placeholder={t('diesel.litersPlaceholder')}
              value={liters}
              onChange={e => setLiters(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('diesel.priceUsd')}</label>
            <Input
              type="number"
              step="any"
              min="0.01"
              placeholder={t('diesel.pricePlaceholder')}
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t('diesel.save')}
          </Button>
        </form>
      </Card>

      {/* Table grouped by month */}
      {filteredEntries.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-muted-foreground">{t('diesel.noEntries')}</div>
        </Card>
      ) : (
        groupedByMonth.map(([monthKey, monthEntries]) => (
          <Card key={monthKey}>
            <div className="px-4 py-3 border-b bg-muted/50">
              <h4 className="text-sm font-semibold text-muted-foreground">{getMonthLabel(monthKey)}</h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t('diesel.liters')}</TableHead>
                  <TableHead>{t('diesel.priceUsd')}</TableHead>
                  <TableHead>{t('diesel.date')}</TableHead>
                  <TableHead>{t('diesel.time')}</TableHead>
                  <TableHead className="text-end"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthEntries.map((entry, i) => {
                  const isEditing = editingId === entry.id;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input type="number" step="any" min="0.01" value={editForm.liters} onChange={e => setEditForm(f => ({ ...f, liters: e.target.value }))} className="h-8 w-24" />
                        ) : entry.liters.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input type="number" step="any" min="0.01" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} className="h-8 w-24" />
                        ) : `$${entry.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>{formatTime(entry.date)}</TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => saveEdit(entry.id)}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEdit}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(entry)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(entry.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ))
      )}
    </div>
  );
};

export default DieselPurchases;
