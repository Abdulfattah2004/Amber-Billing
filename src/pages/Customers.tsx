import React, { useState, useRef } from 'react';
import { useData, Customer } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Printer, CheckCircle, XCircle, AlertTriangle, Trash2, Pencil, CalendarDays, Info, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
  const { customers, records, currentMonth, setCurrentMonth, setUsage, setRecordDiscount, togglePaid, getRecord, settings, calculatePrice, deleteCustomer, updateCustomer, formatCurrency, isFirstMonth } = useData();
  const { isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [printCustomer, setPrintCustomer] = useState<Customer | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.phone.includes(q);
  });

  const handleUsageChange = (customerId: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setUsage(customerId, currentMonth, num);
    }
  };

  const handleDiscountChange = (customerId: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setRecordDiscount(customerId, currentMonth, num);
    } else if (value === '') {
      setRecordDiscount(customerId, currentMonth, 0);
    }
  };

  // Auto-set fixed customers
  React.useEffect(() => {
    customers.forEach(c => {
      if (c.subscriptionType === 'fixed' && c.fixedAmberValue) {
        const record = getRecord(c.id, currentMonth);
        if (!record) {
          setUsage(c.id, currentMonth, c.fixedAmberValue);
        }
      }
    });
  }, [currentMonth, customers]);

  const handlePrint = (customer: Customer) => {
    setPrintCustomer(customer);
    setTimeout(() => window.print(), 300);
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(t('common.confirm'))) {
      deleteCustomer(customer.id);
      toast.success(`${customer.firstName} ${customer.lastName} deleted`);
    }
  };

  const getMonthLabel = (month: string) => {
    const [y, m] = month.split('-');
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString(locale, { year: 'numeric', month: 'long' });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Total amper usage across all fixed customers
  const totalAmperUsage = filtered
    .filter(c => c.subscriptionType === 'fixed')
    .reduce((sum, c) => {
      const record = getRecord(c.id, currentMonth);
      return sum + (record?.usage ?? c.fixedAmberValue ?? 0);
    }, 0);

  const printRecord = printCustomer ? getRecord(printCustomer.id, currentMonth) : undefined;
  const isRtl = language === 'ar';

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('customers.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Input
            type="month"
            value={currentMonth}
            onChange={e => setCurrentMonth(e.target.value)}
            className="w-auto"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: t('customers.total'), value: customers.length, color: 'bg-primary/10 text-primary' },
            { label: t('customers.paid'), value: filtered.filter(c => getRecord(c.id, currentMonth)?.paid).length, color: 'bg-success/10 text-success' },
            { label: t('customers.unpaid'), value: filtered.filter(c => { const r = getRecord(c.id, currentMonth); return r && !r.paid; }).length, color: 'bg-destructive/10 text-destructive' },
            {
              label: t('customers.price'),
              value: formatCurrency(
                filtered.reduce((sum, c) => {
                  const record = getRecord(c.id, currentMonth);
                  const usage = record?.usage ?? (c.subscriptionType === 'fixed' ? c.fixedAmberValue || 0 : 0);
                  const basePrice = record?.price ?? calculatePrice(c, usage, currentMonth);
                  const subscriptionFee = c.subscriptionType === 'counter' ? c.subscriptionFee ?? 0 : 0;
                  const discount = record?.discount ?? c.discount ?? 0;
                  const finalPrice = Math.max(0, basePrice + subscriptionFee - discount);
                  return sum + finalPrice;
                }, 0)
              ),
              color: 'bg-accent text-accent-foreground'
            },
            { label: t('customers.totalAmper'), value: totalAmperUsage, color: 'bg-warning/10 text-warning-foreground', icon: true },
          ].map((stat, i) => (
            <div key={i} className={`rounded-xl p-4 ${stat.color}`}>
              <div className="flex items-center gap-1.5">
                {(stat as any).icon && <Zap className="h-3.5 w-3.5 opacity-70" />}
                <p className="text-xs font-medium opacity-70">{stat.label}</p>
              </div>
              <p className="text-xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p>{t('customers.noCustomers')}</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('customers.name')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground hidden md:table-cell">{t('customers.address')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground hidden lg:table-cell">{t('customers.phone')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground hidden lg:table-cell">{t('customers.boxNumber')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground hidden lg:table-cell">{t('customers.wireNumber')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('customers.type')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground hidden lg:table-cell">{t('customers.subscriptionFee')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('customers.usage')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('customers.price')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('customers.discount')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('customers.finalPrice')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('customers.status')}</th>
                  <th className="px-4 py-3 text-end font-medium text-muted-foreground">{t('customers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(customer => {
                  const record = getRecord(customer.id, currentMonth);
                  const isPaid = record?.paid || false;
                  const usage = record?.usage ?? (customer.subscriptionType === 'fixed' ? customer.fixedAmberValue || 0 : 0);
                  const basePrice = record?.price ?? calculatePrice(customer, usage, currentMonth);
                  const subscriptionFee = customer.subscriptionType === 'counter' ? customer.subscriptionFee ?? 0 : 0;
                  const price = record?.price ?? calculatePrice(customer, usage, currentMonth);
                  const discount = record?.discount ?? customer.discount ?? 0;
                  const finalPrice = Math.max(0, price + subscriptionFee - discount);
                  const prorated = record?.prorated || isFirstMonth(customer, currentMonth);

                  return (
                    <tr key={customer.id} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${!isPaid && record ? 'bg-destructive/5' : ''}`}>
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <div>
                            <div>{customer.firstName} {customer.lastName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <CalendarDays className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{formatDate(customer.createdAt)}</span>
                              {prorated && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-0.5">
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                                        {t('receipt.prorated')}
                                      </Badge>
                                      <Info className="h-3 w-3 text-primary/60 cursor-help" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs max-w-[200px]">
                                      {record?.proratedDays && record?.totalDays
                                        ? t('receipt.proratedNote', { days: String(record.proratedDays), total: String(record.totalDays) })
                                        : t('receipt.proratedNote', { days: '—', total: '—' })}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground md:hidden">{customer.address} · F{customer.floor}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{customer.address} · F{customer.floor}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{customer.phone}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{customer.boxNumber || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{customer.wireNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={customer.subscriptionType === 'fixed' ? 'default' : 'secondary'}>
                          {customer.subscriptionType === 'fixed' ? t('customers.fixed') : t('customers.counter')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {customer.subscriptionType === 'counter' ? (
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={customer.subscriptionFee ?? ''}
                            onChange={e => {
                              const val = e.target.value ? parseInt(e.target.value) : undefined;
                              updateCustomer(customer.id, { subscriptionFee: val });
                            }}
                            className="w-20 h-8 text-sm"
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {customer.subscriptionType === 'counter' ? (
                          <Input
                            type="number"
                            min="0"
                            placeholder={t('customers.enterUsage')}
                            value={record?.usage ?? ''}
                            onChange={e => handleUsageChange(customer.id, e.target.value)}
                            className="w-24 h-8 text-sm"
                          />
                        ) : (
                          <span className="font-medium">{customer.fixedAmberValue}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(price)}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={record?.discount || ''}
                          onChange={e => handleDiscountChange(customer.id, e.target.value)}
                          className="w-20 h-8 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {formatCurrency(finalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <Badge className="bg-success text-success-foreground gap-1">
                            <CheckCircle className="h-3 w-3" /> {t('customers.paid')}
                          </Badge>
                        ) : record && currentMonth < `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> {t('customers.late')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <XCircle className="h-3 w-3" /> {t('customers.unpaid')}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!record && customer.subscriptionType === 'counter') {
                                toast.error('Enter usage first');
                                return;
                              }
                              if (!record && customer.subscriptionType === 'fixed') {
                                setUsage(customer.id, currentMonth, customer.fixedAmberValue || 0);
                              }
                              togglePaid(customer.id, currentMonth);
                              toast.success(isPaid ? 'Marked unpaid' : 'Marked paid');
                            }}
                            className="h-8 text-xs"
                          >
                            {isPaid ? t('customers.markUnpaid') : t('customers.markPaid')}
                          </Button>
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/edit-customer/${customer.id}`)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(customer)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(customer)}>
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Receipt — Arabic/English bilingual */}
        {printCustomer && (() => {
          const getPrevMonth = (month: string) => {
            const [y, m] = month.split('-').map(Number);
            const d = new Date(y, m - 2, 1);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          };
          const prevMonth = getPrevMonth(currentMonth);
          const prevRecord = getRecord(printCustomer.id, prevMonth);
          const isCounter = printCustomer.subscriptionType === 'counter';
          const cellStyle = { border: '1px solid #333', padding: '6px 10px', fontSize: '13px' };
          const headerCellStyle = { ...cellStyle, background: '#f0f0f0', fontWeight: 'bold' as const };

          const receiptBasePrice = printRecord?.price ?? 0;
          const receiptSubscriptionFee = isCounter ? printCustomer.subscriptionFee ?? 0 : 0;
          const receiptDiscount = printRecord?.discount ?? 0;
          const receiptFinalPrice = Math.max(0, receiptBasePrice + receiptSubscriptionFee - receiptDiscount);

          return (
            <div ref={receiptRef} className="receipt-print">
              <div style={{ padding: '30px', maxWidth: '440px', margin: '0 auto', fontFamily: isRtl ? '"Noto Sans Arabic", "DM Sans", sans-serif' : '"DM Sans", sans-serif', direction: 'rtl', textAlign: 'right' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid #333', paddingBottom: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>⚡ {t('nav.amberSystem')}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>{t('receipt.title')}</p>
                </div>

                {/* Customer info table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={headerCellStyle}>{t('receipt.customer')}</td>
                      <td style={cellStyle}>{printCustomer.firstName} {printCustomer.lastName}</td>
                    </tr>
                    <tr>
                      <td style={headerCellStyle}>{t('receipt.address')}</td>
                      <td style={cellStyle}>{printCustomer.address}</td>
                    </tr>
                    <tr>
                      <td style={headerCellStyle}>{t('receipt.floor')}</td>
                      <td style={cellStyle}>{printCustomer.floor}</td>
                    </tr>
                    <tr>
                      <td style={headerCellStyle}>{t('receipt.boxNumber')}</td>
                      <td style={cellStyle}>{printCustomer.boxNumber || '—'}</td>
                    </tr>
                    <tr>
                      <td style={headerCellStyle}>{t('receipt.wireNumber')}</td>
                      <td style={cellStyle}>{printCustomer.wireNumber || '—'}</td>
                    </tr>
                    <tr>
                      <td style={headerCellStyle}>{t('receipt.type')}</td>
                      <td style={cellStyle}>{isCounter ? t('receipt.counter') : t('receipt.fixed')}</td>
                    </tr>
                    <tr>
                      <td style={headerCellStyle}>{t('receipt.month')}</td>
                      <td style={cellStyle}>{getMonthLabel(currentMonth)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Usage & Price table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                  <tbody>
                    {isCounter && (
                      <>
                        <tr>
                          <td style={headerCellStyle}>{t('receipt.lastMonthUsage')}</td>
                          <td style={cellStyle}>&nbsp;</td>
                        </tr>
                        <tr>
                          <td style={headerCellStyle}>{t('receipt.currentMonthUsage')}</td>
                          <td style={cellStyle}>{printRecord?.usage ?? 0} {t('receipt.kWh')}</td>
                        </tr>
                        {printCustomer.subscriptionFee ? (
                          <tr>
                            <td style={headerCellStyle}>{t('receipt.subscriptionFee')}</td>
                            <td style={cellStyle}>{formatCurrency(printCustomer.subscriptionFee)}</td>
                          </tr>
                        ) : null}
                        <tr>
                          <td style={{ ...headerCellStyle, fontSize: '15px' }}>{t('receipt.currentMonthPrice')}</td>
                          <td style={{ ...cellStyle, fontSize: '15px', fontWeight: 'bold' }}>{formatCurrency(receiptFinalPrice)}</td>
                        </tr>
                      </>
                    )}
                    {!isCounter && (
                      <>
                        <tr>
                          <td style={headerCellStyle}>{t('receipt.usage')}</td>
                          <td style={cellStyle}>{printRecord?.usage ?? 0} {t('receipt.units')}</td>
                        </tr>
                        <tr>
                          <td style={{ ...headerCellStyle, fontSize: '15px' }}>{t('receipt.finalPrice')}</td>
                          <td style={{ ...cellStyle, fontSize: '15px', fontWeight: 'bold' }}>{formatCurrency(receiptFinalPrice)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>

                {/* Status */}
                <div style={{ textAlign: 'center', padding: '8px', border: '1px solid #333', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>
                  {t('receipt.status')}: {printRecord?.paid ? `✅ ${t('receipt.paid')}` : `❌ ${t('receipt.unpaid')}`}
                </div>

                {printRecord?.prorated && (
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    {t('receipt.prorated')}: {t('receipt.proratedNote', { days: String(printRecord.proratedDays), total: String(printRecord.totalDays) })}
                  </div>
                )}

                {/* Contact */}
                <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {t('receipt.contact')}: 81189718
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#999', borderTop: '1px solid #ccc', paddingTop: '10px', marginTop: '8px' }}>
                  {t('receipt.generated')} {new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </TooltipProvider>
  );
};

export default Customers;