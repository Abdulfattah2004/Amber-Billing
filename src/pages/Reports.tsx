import React, { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, CheckCircle, UsersRound, Wallet } from 'lucide-react';

interface EmployeeMonthly { id: string; name: string; monthlyData: Record<string, { salary: number; loan: number; deduction: number }>; }
interface ExpenseEntry { id: string; amount: number; type: string; date: string; }
const loadEmployees = (): EmployeeMonthly[] => { try { const raw = JSON.parse(localStorage.getItem('amber_employees') || '[]'); return raw.map((e: any) => e.monthlyData ? e : { id: e.id, name: e.name, monthlyData: {} }); } catch { return []; } };
const loadExpenses = (): ExpenseEntry[] => { try { return JSON.parse(localStorage.getItem('amber_expenses') || '[]'); } catch { return []; } };

const Reports = () => {
  const { customers, records, formatCurrency } = useData();
  const { t } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthRecords = useMemo(() =>
    records.filter(r => r.month === selectedMonth),
    [records, selectedMonth]
  );

  const totalCollected = useMemo(() =>
    monthRecords.filter(r => r.paid).reduce((s, r) => s + r.finalPrice, 0),
    [monthRecords]
  );
  const unpaidBalance = useMemo(() =>
    monthRecords.filter(r => !r.paid).reduce((s, r) => s + r.finalPrice, 0),
    [monthRecords]
  );


  const paidCustomers = useMemo(() =>
    monthRecords.filter(r => r.paid).map(r => ({
      ...r,
      customer: customers.find(c => c.id === r.customerId),
    })).filter(r => r.customer),
    [monthRecords, customers]
  );

  const unpaidCustomers = useMemo(() =>
    monthRecords.filter(r => !r.paid).map(r => ({
      ...r,
      customer: customers.find(c => c.id === r.customerId),
    })).filter(r => r.customer),
    [monthRecords, customers]
  );

  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mRecords = records.filter(r => r.month === m);
      months.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        collected: mRecords.filter(r => r.paid).reduce((s, r) => s + r.finalPrice, 0),
        unpaid: mRecords.filter(r => !r.paid).reduce((s, r) => s + r.finalPrice, 0),
      });
    }
    return months;
  }, [records]);

  const pieData = [
    { name: t('customers.paid'), value: paidCustomers.length, color: 'hsl(142, 71%, 45%)' },
    { name: t('customers.unpaid'), value: unpaidCustomers.length, color: 'hsl(0, 72%, 51%)' },
  ].filter(d => d.value > 0);

  const employees = useMemo(() => loadEmployees(), []);
  const expenses = useMemo(() => loadExpenses(), []);
  const totalSalaries = employees.reduce((s, e) => s + (e.monthlyData[selectedMonth]?.salary || 0), 0);
  const totalLoans = employees.reduce((s, e) => s + (e.monthlyData[selectedMonth]?.loan || 0), 0);
  const totalDeductions = monthRecords.reduce((s, r) => s + (r.discount || 0), 0);
  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [expenses, selectedMonth]);
  const totalExpenses = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpected = totalCollected + totalDeductions + unpaidBalance;
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const stats = [
    { label: t('reports.totalCollected'), value: totalCollected, icon: DollarSign, color: 'bg-success/10 text-success' },
    { label: t('reports.expectedIncome'), value: totalExpected, icon: TrendingUp, color: 'bg-primary/10 text-primary' },
    { label: t('reports.unpaidBalance'), value: unpaidBalance, icon: TrendingDown, color: 'bg-destructive/10 text-destructive' },
    { label: t('reports.collectionRate'), value: `${collectionRate}%`, icon: CheckCircle, color: 'bg-accent text-accent-foreground', raw: true },
    { label: t('reports.totalSalaries'), value: totalSalaries, icon: UsersRound, color: 'bg-primary/10 text-primary' },
    { label: t('reports.totalLoans'), value: totalLoans, icon: DollarSign, color: 'bg-warning/10 text-warning-foreground' },
    { label: t('reports.totalDeductions'), value: totalDeductions, icon: TrendingDown, color: 'bg-muted text-muted-foreground' },
    { label: t('reports.totalExpenses'), value: totalExpenses, icon: Wallet, color: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className={`rounded-xl p-4 ${stat.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="h-4 w-4 opacity-70" />
              <p className="text-xs font-medium opacity-70">{stat.label}</p>
            </div>
            <p className="text-xl font-bold">
              {stat.raw ? stat.value : formatCurrency(stat.value as number)}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">{t('reports.summary')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="collected" name={t('customers.paid')} fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unpaid" name={t('customers.unpaid')} fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {pieData.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">{t('reports.collectionRate')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <Badge className="bg-success text-success-foreground">{paidCustomers.length}</Badge>
            <h3 className="text-sm font-semibold">{t('reports.paidCustomers')}</h3>
          </div>
          <div className="divide-y max-h-64 overflow-auto">
            {paidCustomers.map(r => (
              <div key={r.customerId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span>{r.customer!.firstName} {r.customer!.lastName}</span>
                  {r.prorated && <Badge variant="outline" className="ms-2 text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">{t('receipt.prorated')}</Badge>}
                  {r.discount > 0 && <span className="ms-2 text-xs text-muted-foreground">(-{formatCurrency(r.discount)})</span>}
                </div>
                <span className="font-medium">{formatCurrency(r.finalPrice)}</span>
              </div>
            ))}
            {paidCustomers.length === 0 && <p className="px-4 py-6 text-center text-muted-foreground text-sm">—</p>}
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <Badge variant="destructive">{unpaidCustomers.length}</Badge>
            <h3 className="text-sm font-semibold">{t('reports.unpaidCustomers')}</h3>
          </div>
          <div className="divide-y max-h-64 overflow-auto">
            {unpaidCustomers.map(r => (
              <div key={r.customerId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span>{r.customer!.firstName} {r.customer!.lastName}</span>
                  {r.prorated && <Badge variant="outline" className="ms-2 text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">{t('receipt.prorated')}</Badge>}
                  {r.discount > 0 && <span className="ms-2 text-xs text-muted-foreground">(-{formatCurrency(r.discount)})</span>}
                </div>
                <span className="font-medium text-destructive">{formatCurrency(r.finalPrice)}</span>
              </div>
            ))}
            {unpaidCustomers.length === 0 && <p className="px-4 py-6 text-center text-muted-foreground text-sm">—</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
