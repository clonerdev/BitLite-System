import React, { useState } from 'react';
import {
  Shield,
  Check,
  X,
  Ban,
  Unlock,
  PowerOff,
  Plus,
  Search,
  RefreshCw,
  CreditCard,
  Terminal,
  AlertTriangle,
  UserCheck,
  Clock
} from 'lucide-react';
import {
  Lang,
  AccessControlStore,
  ManagedDeviceRecord,
  DeviceAuthStatus
} from './types';

interface AccessControlPanelProps {
  lang: Lang;
  store: AccessControlStore;
  loading: boolean;
  onRefresh: () => void;
  onToggleGlobal: (enabled: boolean) => Promise<void>;
  onDeviceAction: (
    identity: string,
    action: 'approve' | 'reject' | 'block' | 'unblock' | 'revoke' | 'disconnect' | 'set_limit',
    maxConnections?: number
  ) => Promise<void>;
  onAuthorizeNew: (
    identity: string,
    maxConnections: number,
    customerMaxConnections: number,
    paymentTier: string
  ) => Promise<void>;
  onUpdateCustomerLimit: (
    wallet: string,
    maxSimultaneousConnections: number,
    paymentTier: string
  ) => Promise<void>;
  onSimulateConnect: (
    identity: string,
    ip: string,
    hashrate: number
  ) => Promise<{ allowed: boolean; message: string }>;
}

export default function AccessControlPanel({
  lang,
  store,
  loading,
  onRefresh,
  onToggleGlobal,
  onDeviceAction,
  onAuthorizeNew,
  onUpdateCustomerLimit,
  onSimulateConnect
}: AccessControlPanelProps) {
  const isFa = lang === 'fa';

  // Filters for Managed Devices table
  const [statusFilter, setStatusFilter] = useState<'all' | DeviceAuthStatus | 'connected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pending queue per-row custom limit before clicking Approve
  const [pendingLimitInputs, setPendingLimitInputs] = useState<Record<string, number>>({});

  // Inline limit editing for existing devices
  const [editingLimitIdentity, setEditingLimitIdentity] = useState<string | null>(null);
  const [editingLimitVal, setEditingLimitVal] = useState<string>('1');

  // Pre-authorize new Wallet.Worker.Device form
  const [newIdentity, setNewIdentity] = useState('');
  const [newDeviceLimit, setNewDeviceLimit] = useState('1');
  const [newCustomerLimit, setNewCustomerLimit] = useState('2');
  const [newPaymentTier, setNewPaymentTier] = useState('Paid Standard Plan');

  // Customer Quota form
  const [quotaWallet, setQuotaWallet] = useState('wallet1');
  const [quotaMaxConns, setQuotaMaxConns] = useState('3');
  const [quotaTier, setQuotaTier] = useState('Pro Paid (3 Connections)');

  // Stratum Handshake Tester state
  const [simIdentity, setSimIdentity] = useState('wallet4.worker1.device401');
  const [simIp, setSimIp] = useState('195.88.24.11');
  const [simHashrate, setSimHashrate] = useState('240.5');
  const [simResult, setSimResult] = useState<{ allowed: boolean; message: string } | null>(null);

  const allDevices = Object.values(store.devices);
  const pendingDevices = allDevices.filter((d) => d.authStatus === 'pending');
  const approvedDevices = allDevices.filter((d) => d.authStatus === 'approved');
  const blockedOrRevoked = allDevices.filter(
    (d) => d.authStatus === 'blocked' || d.authStatus === 'revoked'
  );
  const totalActiveSessions = allDevices.reduce((acc, d) => acc + d.activeConnections, 0);

  const filteredDevices = allDevices.filter((d) => {
    if (statusFilter === 'connected' && d.connectionStatus !== 'connected') return false;
    if (
      statusFilter !== 'all' &&
      statusFilter !== 'connected' &&
      d.authStatus !== statusFilter
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.identity.toLowerCase().includes(q) ||
        d.wallet.toLowerCase().includes(q) ||
        d.worker.toLowerCase().includes(q) ||
        d.deviceId.toLowerCase().includes(q) ||
        d.ip.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getWalletActiveCount = (wallet: string) =>
    allDevices
      .filter((d) => d.wallet === wallet && d.connectionStatus === 'connected')
      .reduce((sum, d) => sum + d.activeConnections, 0);

  const handleAuthorizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdentity.trim()) return;
    await onAuthorizeNew(
      newIdentity.trim(),
      Math.max(1, Number(newDeviceLimit) || 1),
      Math.max(1, Number(newCustomerLimit) || 1),
      newPaymentTier
    );
    setNewIdentity('');
  };

  const handleCustomerQuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaWallet.trim()) return;
    await onUpdateCustomerLimit(
      quotaWallet.trim(),
      Math.max(1, Number(quotaMaxConns) || 1),
      quotaTier
    );
  };

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simIdentity.trim()) return;
    const res = await onSimulateConnect(
      simIdentity.trim(),
      simIp.trim() || '192.168.1.50',
      Number(simHashrate) || 210
    );
    setSimResult(res);
  };

  const renderAuthStatusLabel = (status: DeviceAuthStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="text-emerald-400 font-semibold">
            {isFa ? 'تاییدشده (Approved)' : 'Approved'}
          </span>
        );
      case 'pending':
        return (
          <span className="text-amber-400 font-semibold">
            {isFa ? 'در انتظار تایید (Pending)' : 'Pending'}
          </span>
        );
      case 'rejected':
        return (
          <span className="text-slate-400 font-semibold">
            {isFa ? 'ردشده (Rejected)' : 'Rejected'}
          </span>
        );
      case 'blocked':
        return (
          <span className="text-rose-400 font-semibold">
            {isFa ? 'مسدود (Blocked)' : 'Blocked'}
          </span>
        );
      case 'revoked':
        return (
          <span className="text-orange-400 font-semibold">
            {isFa ? 'لغو مجوز (Revoked)' : 'Revoked'}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-6 max-w-[1440px] w-full mx-auto space-y-6">
      {/* 1. GLOBAL ACCESS-CONTROL HEADER & TOGGLE */}
      <div className="bg-[#121626] border border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2.5">
            <Shield
              className={`w-5 h-5 ${
                store.accessControlEnabled ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
            <h1 className="text-lg font-bold text-white">
              {isFa
                ? 'کنترل دسترسی سطح دستگاه (Wallet.Worker.Device) — BitLite v1.0.0'
                : 'Device-Level Access Control (Wallet.Worker.Device) — BitLite v1.0.0'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {store.accessControlEnabled
              ? isFa
                ? 'حالت سخت‌گیرانه (Strict Mode) فعال است: به صورت پیش‌فرض تمامی اتصالات رد می‌شوند مگر اینکه ترکیب دقیق Wallet.Worker.Device توسط مدیر تایید شده باشد و در سقف مجاز اتصال همزمان دستگاه و مشتری (بر اساس پرداخت) قرار گیرد.'
                : 'Strict Access Control is ENABLED: All connections are denied by default unless the exact Wallet.Worker.Device is explicitly approved by the admin and within device and customer simultaneous connection limits.'
              : isFa
              ? 'حالت عمومی (Public Mode) فعال است: استخر عمومی است و ماینرها می‌توانند به صورت عادی متصل شوند (دستگاه‌های مسدود یا لغو مجوز شده همچنان رد می‌شوند).'
              : 'Public Pool Mode is ACTIVE: Access control is disabled and miners can connect normally (explicitly blocked or revoked devices remain denied).'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefresh}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isFa ? 'بروزرسانی' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => onToggleGlobal(!store.accessControlEnabled)}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              store.accessControlEnabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>
              {store.accessControlEnabled
                ? isFa
                  ? 'کنترل دسترسی: فعال (کلیک برای حالت عمومی)'
                  : 'Access Control: ENABLED (Switch to Public)'
                : isFa
                ? 'کنترل دسترسی: غیرفعال / عمومی (کلیک برای فعال‌سازی)'
                : 'Access Control: DISABLED / Public (Enable Strict)'}
            </span>
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono tabular-nums">
        <div className="bg-[#121626] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-sans">
            {isFa ? 'درخواست‌های در انتظار تایید' : 'Pending Requests Queue'}
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingDevices.length}</div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">
            {isFa ? 'نیازمند بررسی مدیر' : 'Awaiting admin action'}
          </div>
        </div>

        <div className="bg-[#121626] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-sans">
            {isFa ? 'دستگاه‌های تاییدشده (Approved)' : 'Approved Devices'}
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{approvedDevices.length}</div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">
            {isFa ? 'پیش‌فرض ۱ اتصال فعال هر دستگاه' : 'Default 1 active connection/device'}
          </div>
        </div>

        <div className="bg-[#121626] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-sans">
            {isFa ? 'نشست‌های فعال همزمان' : 'Active Connections'}
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{totalActiveSessions}</div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">
            {isFa ? 'مجموع اتصالات مجاز برقرار' : 'Total authorized live sessions'}
          </div>
        </div>

        <div className="bg-[#121626] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-sans">
            {isFa ? 'دستگاه‌های مسدود / لغو مجوز' : 'Blocked & Revoked'}
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{blockedOrRevoked.length}</div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">
            {isFa ? 'قطع اتصال آنی و منع اتصال مجدد' : 'Disconnected & barred from reconnect'}
          </div>
        </div>
      </div>

      {/* 2. PENDING CONNECTION-REQUEST QUEUE */}
      <div className="bg-[#121626] border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              {isFa
                ? `صف درخواست‌های اتصال در انتظار تایید (${pendingDevices.length})`
                : `Pending Connection-Request Queue (${pendingDevices.length})`}
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {isFa
              ? 'دستگاه‌های جدید با فرمت Wallet.Worker.Device تا زمان تایید مدیر اجازه اتصال ندارند'
              : 'New Wallet.Worker.Device attempts are held here until approved or rejected by admin'}
          </span>
        </div>

        {pendingDevices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {isFa
              ? 'در حال حاضر هیچ درخواست اتصالی در صف انتظار قرار ندارد. می‌توانید از بخش «شبیه‌ساز اتصال ماینر» در پایین صفحه یک درخواست جدید ارسال کنید.'
              : 'No pending connection requests in queue. Use the Stratum Connection Tester below to simulate an incoming miner request.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-[#0E121E]/60">
                  <th className="py-3 px-4">
                    {isFa ? 'شناسه کامل (Wallet.Worker.Device)' : 'Exact Identity (Wallet.Worker.Device)'}
                  </th>
                  <th className="py-3 px-4">{isFa ? 'کیف‌پول (مشتری)' : 'Wallet'}</th>
                  <th className="py-3 px-4">{isFa ? 'کارگر (Worker)' : 'Worker'}</th>
                  <th className="py-3 px-4">{isFa ? 'شناسه دستگاه (Device ID)' : 'Device ID'}</th>
                  <th className="py-3 px-4 text-end">{isFa ? 'آدرس IP' : 'Remote IP'}</th>
                  <th className="py-3 px-4 text-end">{isFa ? 'زمان تلاش اتصال' : 'Attempt Time'}</th>
                  <th className="py-3 px-4 text-end">
                    {isFa ? 'سقف اتصال مجاز (پیش‌فرض ۱)' : 'Max Connections (Default 1)'}
                  </th>
                  <th className="py-3 px-4 text-end">{isFa ? 'عملیات مدیر' : 'Admin Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono tabular-nums">
                {pendingDevices.map((req) => {
                  const limitVal = pendingLimitInputs[req.identity] ?? 1;
                  return (
                    <tr key={req.identity} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-amber-300" dir="ltr">
                        {req.identity}
                      </td>
                      <td className="py-3 px-4 text-indigo-400" dir="ltr">
                        {req.wallet}
                      </td>
                      <td className="py-3 px-4 text-slate-200" dir="ltr">
                        {req.worker}
                      </td>
                      <td className="py-3 px-4 text-slate-200" dir="ltr">
                        {req.deviceId}
                      </td>
                      <td className="py-3 px-4 text-end text-slate-300" dir="ltr">
                        {req.ip}
                      </td>
                      <td className="py-3 px-4 text-end text-slate-400" dir="ltr">
                        {req.lastAttemptAt}
                      </td>
                      <td className="py-3 px-4 text-end">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          dir="ltr"
                          value={limitVal}
                          onChange={(e) =>
                            setPendingLimitInputs((prev) => ({
                              ...prev,
                              [req.identity]: Math.max(1, Number(e.target.value) || 1)
                            }))
                          }
                          className="w-16 bg-[#090C14] border border-slate-700 rounded px-2 py-1 text-center text-white font-mono"
                        />
                      </td>
                      <td className="py-3 px-4 text-end font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onDeviceAction(req.identity, 'approve', limitVal)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isFa ? 'تایید (Approve)' : 'Approve'}</span>
                          </button>
                          <button
                            onClick={() => onDeviceAction(req.identity, 'reject')}
                            className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{isFa ? 'رد (Reject)' : 'Reject'}</span>
                          </button>
                          <button
                            onClick={() => onDeviceAction(req.identity, 'block')}
                            className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{isFa ? 'مسدود (Block)' : 'Block'}</span>
                          </button>
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

      {/* 3. AUTHORIZED & MANAGED DEVICES PANEL */}
      <div className="bg-[#121626] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-white">
              {isFa
                ? 'پنل مدیریت دستگاه‌ها، مجوزها و تعداد اتصالات فعال'
                : 'Authorized & Managed Devices Registry'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa
                ? 'نمایش کیف‌پول، کارگر، شناسه دستگاه، هش‌ریت، وضعیت اتصال، زمان اتصال و تعداد اتصالات همزمان'
                : 'Monitor wallet, worker, device ID, hashrate, connection status, connection time, and active connection counts'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 bg-[#0B0E17] p-1 rounded-lg border border-slate-800 text-xs">
              {(
                [
                  { key: 'all', fa: 'همه', en: 'All' },
                  { key: 'connected', fa: 'متصل (Connected)', en: 'Connected' },
                  { key: 'approved', fa: 'تاییدشده', en: 'Approved' },
                  { key: 'pending', fa: 'در انتظار', en: 'Pending' },
                  { key: 'blocked', fa: 'مسدود', en: 'Blocked' },
                  { key: 'revoked', fa: 'لغوشده', en: 'Revoked' }
                ] as { key: typeof statusFilter; fa: string; en: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isFa ? tab.fa : tab.en}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa
                    ? 'جستجوی Wallet.Worker.Device...'
                    : 'Search Wallet.Worker.Device...'
                }
                className="pl-8 pr-3 py-1.5 bg-[#0B0E17] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-[#0E121E]/60">
                <th className="py-3 px-4">{isFa ? 'کیف‌پول (Wallet)' : 'Wallet'}</th>
                <th className="py-3 px-4">{isFa ? 'کارگر (Worker)' : 'Worker'}</th>
                <th className="py-3 px-4">{isFa ? 'شناسه دستگاه (Device ID)' : 'Device ID'}</th>
                <th className="py-3 px-4 text-end">{isFa ? 'هش‌ریت' : 'Hashrate'}</th>
                <th className="py-3 px-4">{isFa ? 'وضعیت اتصال و مجوز' : 'Connection & Auth Status'}</th>
                <th className="py-3 px-4 text-end">{isFa ? 'زمان اتصال' : 'Connection Time'}</th>
                <th className="py-3 px-4 text-end">
                  {isFa ? 'اتصالات فعال / سقف مجاز' : 'Active / Max Limit'}
                </th>
                <th className="py-3 px-4 text-end">{isFa ? 'عملیات مدیریت و قطع آنی' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono tabular-nums">
              {filteredDevices.map((dev) => {
                const isEditingLimit = editingLimitIdentity === dev.identity;
                const customerQuota = store.customers[dev.wallet]?.maxSimultaneousConnections ?? 1;
                const walletActive = getWalletActiveCount(dev.wallet);

                return (
                  <tr key={dev.identity} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-indigo-400 font-semibold" dir="ltr">
                      <div>{dev.wallet}</div>
                      <div className="text-[10px] text-slate-500">
                        {isFa ? 'سهمیه مشتری:' : 'Customer Quota:'} {walletActive}/{customerQuota}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-200" dir="ltr">
                      {dev.worker}
                    </td>
                    <td className="py-3 px-4 text-white font-semibold" dir="ltr">
                      <div>{dev.deviceId}</div>
                      <div className="text-[10px] text-slate-500">{dev.identity}</div>
                    </td>
                    <td className="py-3 px-4 text-end font-semibold text-emerald-400" dir="ltr">
                      {dev.connectionStatus === 'connected'
                        ? `${dev.hashrate.toFixed(2)} ${dev.unit}H/s`
                        : '0.00 TH/s'}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              dev.connectionStatus === 'connected'
                                ? 'text-emerald-400 font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            {dev.connectionStatus === 'connected'
                              ? isFa
                                ? '● متصل (Connected)'
                                : '● Connected'
                              : isFa
                              ? '○ قطع (Disconnected)'
                              : '○ Disconnected'}
                          </span>
                          <span className="text-slate-600">·</span>
                          {renderAuthStatusLabel(dev.authStatus)}
                        </div>
                        {dev.lastDisconnectReason && (
                          <div className="text-[11px] text-slate-500">
                            {dev.lastDisconnectReason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-end text-slate-300" dir="ltr">
                      <div>{dev.connectedAt || '—'}</div>
                      <div className="text-[10px] text-slate-500">IP: {dev.ip}</div>
                    </td>
                    <td className="py-3 px-4 text-end" dir="ltr">
                      {isEditingLimit ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={editingLimitVal}
                            onChange={(e) => setEditingLimitVal(e.target.value)}
                            className="w-14 bg-[#090C14] border border-indigo-500 rounded px-1.5 py-0.5 text-center text-white"
                          />
                          <button
                            onClick={async () => {
                              await onDeviceAction(
                                dev.identity,
                                'set_limit',
                                Math.max(1, Number(editingLimitVal) || 1)
                              );
                              setEditingLimitIdentity(null);
                            }}
                            className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] cursor-pointer"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={
                              dev.activeConnections > 0
                                ? 'text-emerald-400 font-bold'
                                : 'text-slate-400'
                            }
                          >
                            {dev.activeConnections} / {dev.maxConnections}
                          </span>
                          <button
                            onClick={() => {
                              setEditingLimitIdentity(dev.identity);
                              setEditingLimitVal(String(dev.maxConnections));
                            }}
                            className="text-[11px] text-indigo-400 hover:underline font-sans cursor-pointer"
                          >
                            {isFa ? 'تغییر سقف' : 'Edit'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-end font-sans">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {dev.authStatus !== 'approved' && (
                          <button
                            onClick={() =>
                              onDeviceAction(dev.identity, 'approve', dev.maxConnections || 1)
                            }
                            className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {isFa ? 'تایید' : 'Approve'}
                          </button>
                        )}

                        {dev.connectionStatus === 'connected' && (
                          <button
                            onClick={() => onDeviceAction(dev.identity, 'disconnect')}
                            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <PowerOff className="w-3 h-3" />
                            <span>{isFa ? 'قطع آنی' : 'Disconnect'}</span>
                          </button>
                        )}

                        {dev.authStatus === 'approved' && (
                          <button
                            onClick={() => onDeviceAction(dev.identity, 'revoke')}
                            className="px-2.5 py-1 rounded bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {isFa ? 'لغو مجوز (Revoke)' : 'Revoke'}
                          </button>
                        )}

                        {dev.authStatus === 'blocked' ? (
                          <button
                            onClick={() => onDeviceAction(dev.identity, 'unblock')}
                            className="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>{isFa ? 'رفع مسدودی' : 'Unblock'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onDeviceAction(dev.identity, 'block')}
                            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Ban className="w-3 h-3" />
                            <span>{isFa ? 'مسدودسازی' : 'Block'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. THREE-COLUMN MANAGEMENT TOOLS: Pre-Authorize Device | Customer Payment Quotas | Stratum Connection Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Col 1 (4 cols): Pre-Authorize New Wallet.Worker.Device */}
        <form
          onSubmit={handleAuthorizeSubmit}
          className="lg:col-span-4 bg-[#121626] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 text-xs"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>
                {isFa
                  ? 'تعریف و تایید مستقیم دستگاه جدید'
                  : 'Pre-Authorize Wallet.Worker.Device'}
              </span>
            </div>
            <p className="text-slate-400">
              {isFa
                ? 'ثبت مستقیم ترکیب Wallet.Worker.Device به همراه سقف اتصال همزمان دستگاه و مشتری.'
                : 'Directly authorize a specific Wallet.Worker.Device and configure its simultaneous connection limit.'}
            </p>

            <div>
              <label className="block text-slate-300 mb-1">
                {isFa ? 'شناسه دقیق (Wallet.Worker.Device) *' : 'Exact Identity (Wallet.Worker.Device) *'}
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={newIdentity}
                onChange={(e) => setNewIdentity(e.target.value)}
                placeholder="wallet1.worker1.device105"
                className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'سقف اتصال دستگاه' : 'Device Limit'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  dir="ltr"
                  value={newDeviceLimit}
                  onChange={(e) => setNewDeviceLimit(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'سقف کل مشتری (کیف‌پول)' : 'Customer Limit'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  dir="ltr"
                  value={newCustomerLimit}
                  onChange={(e) => setNewCustomerLimit(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                {isFa ? 'سطح اشتراک / پرداخت مشتری' : 'Customer Payment Tier'}
              </label>
              <input
                type="text"
                value={newPaymentTier}
                onChange={(e) => setNewPaymentTier(e.target.value)}
                className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isFa ? 'افزودن به دستگاه‌های مجاز' : 'Authorize Device'}</span>
          </button>
        </form>

        {/* Col 2 (4 cols): Customer / Wallet Simultaneous Connection Limits (Payment-Based) */}
        <div className="lg:col-span-4 bg-[#121626] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 text-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>
                {isFa
                  ? 'سقف اتصال همزمان مشتریان (بر اساس پرداخت)'
                  : 'Customer Connection Quotas (Payment-Based)'}
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto divide-y divide-slate-800/70 border border-slate-800 rounded-lg bg-[#0B0E17] px-3">
              {Object.values(store.customers).map((cust) => {
                const activeCount = getWalletActiveCount(cust.wallet);
                return (
                  <div
                    key={cust.wallet}
                    onClick={() => {
                      setQuotaWallet(cust.wallet);
                      setQuotaMaxConns(String(cust.maxSimultaneousConnections));
                      setQuotaTier(cust.paymentTier);
                    }}
                    className="py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-900/60"
                  >
                    <div dir="ltr">
                      <div className="font-mono font-semibold text-indigo-400">{cust.wallet}</div>
                      <div className="text-[11px] text-slate-400">{cust.paymentTier}</div>
                    </div>
                    <div className="font-mono text-end" dir="ltr">
                      <span className="text-emerald-400 font-bold">{activeCount}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-white">{cust.maxSimultaneousConnections}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleCustomerQuotaSubmit} className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1">
                    {isFa ? 'کیف‌پول مشتری' : 'Customer Wallet'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={quotaWallet}
                    onChange={(e) => setQuotaWallet(e.target.value)}
                    className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">
                    {isFa ? 'سقف اتصال همزمان' : 'Max Connections'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    dir="ltr"
                    value={quotaMaxConns}
                    onChange={(e) => setQuotaMaxConns(e.target.value)}
                    className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'پلن پرداخت' : 'Payment Plan'}
                </label>
                <input
                  type="text"
                  value={quotaTier}
                  onChange={(e) => setQuotaTier(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                {isFa ? 'بروزرسانی سهمیه مشتری' : 'Save Customer Quota'}
              </button>
            </form>
          </div>
        </div>

        {/* Col 3 (4 cols): Stratum Connection Handshake Simulator */}
        <form
          onSubmit={handleSimulateSubmit}
          className="lg:col-span-4 bg-[#121626] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 text-xs"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>
                {isFa
                  ? 'شبیه‌ساز اتصال ماینر (تست گارد سرور)'
                  : 'Stratum Handshake & Guard Tester'}
              </span>
            </div>
            <p className="text-slate-400">
              {isFa
                ? 'ارسال درخواست اتصال واقعی به سرور جهت تست صف انتظار، جلوگیری از اتصال تکراری و رد دستگاه‌های مسدود.'
                : 'Test server-side enforcement: simulate a miner connecting with Wallet.Worker.Device.'}
            </p>

            <div>
              <label className="block text-slate-300 mb-1">
                {isFa ? 'شناسه ماینر (Wallet.Worker.Device)' : 'Miner Identity (Wallet.Worker.Device)'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={simIdentity}
                onChange={(e) => setSimIdentity(e.target.value)}
                placeholder="wallet1.worker1.device101"
                className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">IP</label>
                <input
                  type="text"
                  dir="ltr"
                  value={simIp}
                  onChange={(e) => setSimIp(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'هش‌ریت (TH/s)' : 'Hashrate (TH/s)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  dir="ltr"
                  value={simHashrate}
                  onChange={(e) => setSimHashrate(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            {simResult && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  simResult.allowed
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                }`}
              >
                {simResult.message}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            {isFa ? 'تست اتصال به استخر' : 'Simulate Miner Connection'}
          </button>
        </form>
      </div>

      {/* 5. PERSISTENT AUDIT & CONNECTION SECURITY LOG */}
      <div className="bg-[#121626] border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            {isFa
              ? 'لاگ امنیتی تلاش‌های اتصال و اقدامات مدیر (ذخیره‌شده در سرور)'
              : 'Server-Side Connection Attempts & Admin Audit Log'}
          </h3>
          <span className="text-xs font-mono text-slate-400" dir="ltr">
            Persisted in /data/access-control.json
          </span>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/50 text-xs font-mono">
          {store.auditLogs.map((log) => (
            <div
              key={log.id}
              className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-900/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-slate-500 shrink-0" dir="ltr">
                  [{log.timestamp}]
                </span>
                <span
                  className={`font-semibold shrink-0 ${
                    log.type === 'connection_allowed'
                      ? 'text-emerald-400'
                      : log.type === 'connection_denied'
                      ? 'text-rose-400'
                      : log.type === 'immediate_disconnect'
                      ? 'text-amber-400'
                      : 'text-indigo-400'
                  }`}
                  dir="ltr"
                >
                  {log.action}
                </span>
                <span className="text-slate-200 font-semibold shrink-0" dir="ltr">
                  {log.identity}
                </span>
                <span className="text-slate-300 font-sans truncate">
                  {isFa ? log.detailsFa : log.detailsEn}
                </span>
              </div>
              <span className="text-slate-500 shrink-0" dir="ltr">
                IP: {log.ip}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
