import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const AddCustomer = () => {
  const { addCustomer, updateCustomer, customers } = useData();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const existing = isEdit ? customers.find(c => c.id === id) : undefined;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    floor: '',
    subscriptionType: 'fixed' as 'fixed' | 'counter',
    fixedAmberValue: '',
    discount: '',
    boxNumber: '',
    wireNumber: '',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        firstName: existing.firstName,
        lastName: existing.lastName,
        address: existing.address,
        phone: existing.phone,
        floor: existing.floor,
        subscriptionType: existing.subscriptionType,
        fixedAmberValue: existing.fixedAmberValue?.toString() || '',
        discount: existing.discount?.toString() || '',
        boxNumber: existing.boxNumber || '',
        wireNumber: existing.wireNumber || '',
      });
    }
  }, [existing]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.floor.trim()) e.floor = 'Required';
    if (form.subscriptionType === 'fixed' && (!form.fixedAmberValue || parseFloat(form.fixedAmberValue) <= 0)) {
      e.fixedAmberValue = 'Required for fixed subscription';
    }
    if (form.discount && parseFloat(form.discount) < 0) {
      e.discount = 'Cannot be negative';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      floor: form.floor.trim(),
      subscriptionType: form.subscriptionType,
      fixedAmberValue: form.subscriptionType === 'fixed' ? parseFloat(form.fixedAmberValue) : undefined,
      discount: form.discount ? parseFloat(form.discount) : 0,
      boxNumber: form.boxNumber.trim(),
      wireNumber: form.wireNumber.trim(),
    };

    if (isEdit && id) {
      updateCustomer(id, data);
      toast.success(t('add.updateSuccess'));
    } else {
      addCustomer(data);
      toast.success(t('add.success'));
    }
    navigate('/');
  };

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-6">
        <h2 className="text-xl font-bold">{isEdit ? t('add.editTitle') : t('add.title')}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t('add.firstName')}</Label>
            <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>{t('add.lastName')}</Label>
            <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t('add.address')}</Label>
          <Input value={form.address} onChange={e => update('address', e.target.value)} />
          {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t('add.phone')}</Label>
            <Input value={form.phone} onChange={e => update('phone', e.target.value)} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>{t('add.floor')}</Label>
            <Input value={form.floor} onChange={e => update('floor', e.target.value)} />
            {errors.floor && <p className="text-xs text-destructive">{errors.floor}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t('add.subType')}</Label>
          <div className="flex gap-3">
            {(['fixed', 'counter'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => update('subscriptionType', type)}
                className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                  form.subscriptionType === type
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                {type === 'fixed' ? t('customers.fixed') : t('customers.counter')}
              </button>
            ))}
          </div>
        </div>

        {form.subscriptionType === 'fixed' && (
          <div className="space-y-1.5 animate-fade-in">
            <Label>{t('add.fixedValue')}</Label>
            <Input
              type="number"
              min="0"
              value={form.fixedAmberValue}
              onChange={e => update('fixedAmberValue', e.target.value)}
            />
            {errors.fixedAmberValue && <p className="text-xs text-destructive">{errors.fixedAmberValue}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <Label>{t('add.discount')}</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.discount}
            onChange={e => update('discount', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t('add.discountHint')}</p>
          {errors.discount && <p className="text-xs text-destructive">{errors.discount}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t('add.boxNumber')}</Label>
            <Input value={form.boxNumber} onChange={e => update('boxNumber', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('add.wireNumber')}</Label>
            <Input value={form.wireNumber} onChange={e => update('wireNumber', e.target.value)} />
          </div>
        </div>

        <Button type="submit" className="w-full">
          {isEdit ? t('add.update') : t('add.save')}
        </Button>
      </form>
    </div>
  );
};

export default AddCustomer;
