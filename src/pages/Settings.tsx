import React, { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Plus, Globe, Zap, Users, BatteryCharging } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SettingsPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const { settings, updateSettings } = useData();
  const { users, addUser, removeUser } = useAuth();

  const [price, setPrice] = useState(settings.amberPricePerUnit.toString());
  const [kwhPrice, setKwhPrice] = useState(settings.kwhPrice.toString());
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'employee' as UserRole });

  const handleSavePrice = () => {
    const val = parseFloat(price);
    const kwh = parseFloat(kwhPrice);
    if (isNaN(val) || val <= 0) {
      toast.error('Invalid amber price');
      return;
    }
    if (isNaN(kwh) || kwh <= 0) {
      toast.error('Invalid kWh price');
      return;
    }
    updateSettings({ amberPricePerUnit: val, kwhPrice: kwh });
    toast.success(t('settings.saved'));
  };

  const handleAddUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      toast.error('Fill all fields');
      return;
    }
    if (addUser(newUser.username.trim(), newUser.password.trim(), newUser.role)) {
      toast.success('User added');
      setNewUser({ username: '', password: '', role: 'employee' });
    } else {
      toast.error('Username already exists');
    }
  };

  const handleRemoveUser = (username: string) => {
    if (confirm(t('common.confirm'))) {
      if (removeUser(username)) {
        toast.success('User removed');
      } else {
        toast.error('Cannot remove last user');
      }
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
      {/* Language */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t('settings.language')}</h3>
        </div>
        <div className="flex gap-3">
          {(['en', 'ar'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                language === lang
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              {lang === 'en' ? t('settings.english') : t('settings.arabic')}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t('settings.amberPrice')}</h3>
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.amberPrice')} (USD)</Label>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <BatteryCharging className="h-4 w-4 text-muted-foreground" />
            <Label>{t('settings.kwhPrice')} (USD)</Label>
          </div>
          <Input type="number" step="0.01" value={kwhPrice} onChange={e => setKwhPrice(e.target.value)} />
        </div>
        <Button onClick={handleSavePrice} className="w-full">{t('settings.save')}</Button>
      </div>

      {/* User Management */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t('settings.userManagement')}</h3>
        </div>

        <div className="divide-y rounded-lg border">
          {users.map(u => (
            <div key={u.username} className="flex items-center justify-between px-3 py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{u.username}</span>
                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                  {t(`settings.${u.role}`)}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveUser(u.username)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={t('login.username')}
              value={newUser.username}
              onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
            />
            <Input
              placeholder={t('login.password')}
              type="password"
              value={newUser.password}
              onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 gap-2">
              {(['admin', 'employee'] as const).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setNewUser(p => ({ ...p, role }))}
                  className={`flex-1 rounded-lg border-2 p-2 text-xs font-medium transition-colors ${
                    newUser.role === role
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {t(`settings.${role}`)}
                </button>
              ))}
            </div>
            <Button size="icon" onClick={handleAddUser} className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
