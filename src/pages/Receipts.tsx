import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Receipt, ChevronDown, ChevronUp, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ITEMS_PER_PAGE = 20;

const Receipts = () => {
  const { customers, records, formatCurrency } = useData();
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Only paid records
  const paidRecords = useMemo(() => records.filter(r => r.paid), [records]);

  // Group by customer, then by month
  const grouped = useMemo(() => {
    const map = new Map<string, typeof paidRecords>();
    paidRecords.forEach(r => {
      if (!map.has(r.customerId)) map.set(r.customerId, []);
      map.get(r.customerId)!.push(r);
    });
    // Sort each customer's records by month descending
    map.forEach((recs) => recs.sort((a, b) => b.month.localeCompare(a.month)));
    return map;
  }, [paidRecords]);

  // Filter customers by search and sort by most recent payment
  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = customers.filter(c => {
      if (!grouped.has(c.id)) return false;
      if (!q) return true;
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      return name.includes(q) || c.phone.includes(q);
    });
    // Sort customers by their most recent paidAt date descending
    filtered.sort((a, b) => {
      const aRecs = grouped.get(a.id) || [];
      const bRecs = grouped.get(b.id) || [];
      const aLatest = aRecs.reduce((max, r) => r.paidAt && r.paidAt > max ? r.paidAt : max, '');
      const bLatest = bRecs.reduce((max, r) => r.paidAt && r.paidAt > max ? r.paidAt : max, '');
      return bLatest.localeCompare(aLatest);
    });
    return filtered;
  }, [customers, grouped, search]);

  const displayedCustomers = filteredCustomers.slice(0, visibleCount);

  const toggleCustomer = (id: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatMonthLabel = (month: string) => {
    const [y, m] = month.split('-');
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString(locale, { year: 'numeric', month: 'long' });
  };

  const formatDateTime = (iso: string) => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(iso).toLocaleString(locale, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Group a customer's records by month
  const groupByMonth = (recs: typeof paidRecords) => {
    const map = new Map<string, typeof paidRecords>();
    recs.forEach(r => {
      if (!map.has(r.month)) map.set(r.month, []);
      map.get(r.month)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('receipts.search')}
          value={search}
          onChange={e => { setSearch(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
          className="ps-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl p-4 bg-primary/10 text-primary">
          <p className="text-xs font-medium opacity-70">{t('receipts.totalReceipts')}</p>
          <p className="text-xl font-bold mt-1">{paidRecords.length}</p>
        </div>
        <div className="rounded-xl p-4 bg-success/10 text-success">
          <p className="text-xs font-medium opacity-70">{t('receipts.totalCollected')}</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(paidRecords.reduce((s, r) => s + (r.finalPrice ?? r.price), 0))}</p>
        </div>
        <div className="rounded-xl p-4 bg-accent text-accent-foreground">
          <p className="text-xs font-medium opacity-70">{t('receipts.customersWithReceipts')}</p>
          <p className="text-xl font-bold mt-1">{grouped.size}</p>
        </div>
      </div>

      {/* Content */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Receipt className="h-12 w-12 mb-3 opacity-40" />
          <p>{search ? t('receipts.noResults') : t('receipts.noReceipts')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedCustomers.map(customer => {
            const customerRecords = grouped.get(customer.id) || [];
            const isOpen = expandedCustomers.has(customer.id);
            const monthGroups = groupByMonth(customerRecords);

            return (
              <Collapsible key={customer.id} open={isOpen} onOpenChange={() => toggleCustomer(customer.id)}>
                <div className="rounded-xl border bg-card overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-start">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {customer.firstName[0]}{customer.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold">{customer.firstName} {customer.lastName}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{customer.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{customerRecords.length} {t('receipts.receipts')}</Badge>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t px-4 pb-4">
                      {monthGroups.map(([month, recs]) => (
                        <div key={month} className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-sm font-semibold text-muted-foreground">{formatMonthLabel(month)}</h4>
                          </div>
                          <div className="space-y-2">
                            {recs.map((rec, i) => (
                              <div key={i} className="rounded-lg border bg-muted/20 p-3">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
                                  <div>
                                    <span className="text-xs text-muted-foreground">{t('receipts.amount')}</span>
                                    <p className="font-bold text-primary">{formatCurrency(rec.finalPrice ?? rec.price)}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground">{t('receipts.usage')}</span>
                                    <p className="font-medium">{rec.usage} {t('receipt.units')}</p>
                                  </div>
                                  {(rec.discount ?? 0) > 0 && (
                                    <div>
                                      <span className="text-xs text-muted-foreground">{t('receipts.discount')}</span>
                                      <p className="font-medium text-destructive">-{formatCurrency(rec.discount)}</p>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-xs text-muted-foreground">{t('receipts.paidAt')}</span>
                                    <p className="font-medium flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      {rec.paidAt ? formatDateTime(rec.paidAt) : '—'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{customer.address}</span>
                                  {rec.prorated && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                      {t('receipt.prorated')} ({rec.proratedDays}/{rec.totalDays})
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}

          {/* Load more */}
          {visibleCount < filteredCustomers.length && (
            <button
              onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
              className="w-full py-3 text-sm font-medium text-primary hover:underline"
            >
              {t('receipts.loadMore')} ({filteredCustomers.length - visibleCount} {t('receipts.remaining')})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Receipts;
