import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Settings,
  Terminal,
  Search,
  Edit3,
  Sliders,
  Play,
  Square,
  Trash2,
  Download,
  Upload,
  Check,
  Copy,
  X,
  Shield
} from 'lucide-react';
import {
  Lang,
  WorkspaceMode,
  SettingsCategory,
  ProxyPort,
  MinerWorker,
  PoolNodeItem,
  AccessControlStore
} from './types';
import {
  INITIAL_PROXIES,
  INITIAL_POOL_NODES,
  SUPPORTED_ALGORITHMS
} from './mockData';
import AccessControlPanel from './AccessControlPanel';

const APP_VERSION = '1.0.0';

const COIN_ICON_MAP: Record<string, string> = {
  BTC: '/image/icon-btc.png',
  BCH: '/image/icon-bch.png',
  LTC: '/image/icon-ltc.png',
  'KAS(ks3)': '/image/icon-kas(ks3).png',
  KASPA: '/image/icon-kaspa.png',
  'ETC+ZIL': '/image/icon-etc+zil.png',
  ETC: '/image/icon-etc.png',
  ETHW: '/image/icon-ethw.png',
  FB: '/image/icon-fb.png',
  ALEO: '/image/icon-aleo.png',
  CFX: '/image/icon-cfx.png',
  ZEC: '/image/icon-zec.png',
  RVN: '/image/icon-rvn.png',
  ERG: '/image/icon-erg.png',
  XMR: '/image/icon-xmr.png',
  KDA: '/image/icon-kda.png',
  DASH: '/image/icon-dash.png',
  CKB: '/image/icon-ckb.png',
  DIRECT: '/image/merge.png'
};

const FALLBACK_ACCESS_STORE: AccessControlStore = {
  version: '1.0.0',
  accessControlEnabled: true,
  devices: {},
  customers: {},
  auditLogs: []
};

export default function App() {
  const [lang, setLang] = useState<Lang>('fa');
  const [workspace, setWorkspace] = useState<WorkspaceMode>('proxy');
  const [proxies, setProxies] = useState<ProxyPort[]>(INITIAL_PROXIES);
  const [selectedProxyId, setSelectedProxyId] = useState<string>(INITIAL_PROXIES[0].id);
  const [poolNodes, setPoolNodes] = useState<PoolNodeItem[]>(INITIAL_POOL_NODES);

  // Server-persisted Device-Level Access Control State
  const [accessStore, setAccessStore] = useState<AccessControlStore>(FALLBACK_ACCESS_STORE);
  const [accessLoading, setAccessLoading] = useState<boolean>(false);

  // Sub-tabs and filters in Proxy Dashboard
  const [proxySubTab, setProxySubTab] = useState<'devices' | 'wallets' | 'portInfo' | 'console'>('devices');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'online' | 'offline' | 'blocked'>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [workerSearch, setWorkerSearch] = useState<string>('');
  const [sidebarSearch, setSidebarSearch] = useState<string>('');

  // Modals
  const [inspectedWorker, setInspectedWorker] = useState<MinerWorker | null>(null);
  const [workerModalTab, setWorkerModalTab] = useState<'desc' | 'logs' | 'console'>('desc');
  const [workerConsoleInput, setWorkerConsoleInput] = useState<string>('');

  const [showCreateProxyModal, setShowCreateProxyModal] = useState<boolean>(false);
  const [editingProxy, setEditingProxy] = useState<ProxyPort | null>(null);
  const [showHotFeeModal, setShowHotFeeModal] = useState<boolean>(false);
  const [hotFeeValue, setHotFeeValue] = useState<string>('1.16');
  const [hotFeeWallet, setHotFeeWallet] = useState<string>('');

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>('2fa');
  const [showCreateNodeModal, setShowCreateNodeModal] = useState<boolean>(false);

  // Settings state for BitLite System v1.0.0
  const [totpTitle, setTotpTitle] = useState('BitLite System');
  const [totpDesc, setTotpDesc] = useState('BitLite System Admin');
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [adminUser, setAdminUser] = useState('bitlite_admin');
  const [adminPass, setAdminPass] = useState('bl_9948201_sec');
  const [safePath, setSafePath] = useState('/bitlite-console');
  const [sessionTtlHours, setSessionTtlHours] = useState('24');
  const [webAccessPort, setWebAccessPort] = useState('63521');
  const [ipBlacklist, setIpBlacklist] = useState('185.220.101.44\n45.155.205.109');
  const [walletBlacklist, setWalletBlacklist] = useState('0xdead0000000000000000');
  const [walletWhitelist, setWalletWhitelist] = useState('wallet1\nfarm_north_btc01\nscrypt_king_88');
  const [webhookUrl, setWebhookUrl] = useState('https://api.telegram.org/bot<token>/sendMessage');
  const [blcSecretKey, setBlcSecretKey] = useState('BLC-ENC-2026-SHA256-9F8A7B6C5D4E');
  const [settingsSavedToast, setSettingsSavedToast] = useState<string | null>(null);

  // New Proxy Form state
  const [formCoin, setFormCoin] = useState('BTC');
  const [formLabel, setFormLabel] = useState('');
  const [formAlgorithm, setFormAlgorithm] = useState('SHA256');
  const [formListenPort, setFormListenPort] = useState('2008');
  const [formProtocol, setFormProtocol] = useState<'TCP' | 'SSL' | 'BLC'>('TCP');
  const [formTargetPool, setFormTargetPool] = useState('btc.f2pool.com');
  const [formTargetPort, setFormTargetPort] = useState('1314');
  const [formBackupPool, setFormBackupPool] = useState('stratum.antpool.com:3333');
  const [formFeeRate, setFormFeeRate] = useState('1.00');
  const [formFeeWallet, setFormFeeWallet] = useState('bitlite_vault.devfee');

  // New Node Form state
  const [nodeCoin, setNodeCoin] = useState('BTC');
  const [nodeMerged, setNodeMerged] = useState('+ FB Bonus');
  const [nodeAlgo, setNodeAlgo] = useState('sha256');
  const [nodePort, setNodePort] = useState('3339');
  const [nodeFee, setNodeFee] = useState('0.8');

  // CLI & Install Script interactive state
  const [selectedInstallMenu, setSelectedInstallMenu] = useState<number>(1);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [portConsoleCmd, setPortConsoleCmd] = useState<string>('');
  const [portConsoleHistory, setPortConsoleHistory] = useState<string[]>([
    '[SYSTEM] BitLite System v1.0.0 Stratum Engine initialized (LimitNOFILE=1048576, TCP BBR=active)',
    '[SYSTEM] Listening on 0.0.0.0:2001 (TCP) -> Upstream btc.f2pool.com:1314 (keepalive=600s)',
    '[SYSTEM] Device-Level Access Control Guard active (Wallet.Worker.Device verification).'
  ]);

  const isFa = lang === 'fa';

  const triggerToast = useCallback((msg: string) => {
    setSettingsSavedToast(msg);
    setTimeout(() => setSettingsSavedToast(null), 2800);
  }, []);

  // Fetch server-persisted Access Control store
  const fetchAccessState = useCallback(async () => {
    setAccessLoading(true);
    try {
      const res = await fetch('/api/access-control/state');
      if (res.ok) {
        const data = (await res.json()) as AccessControlStore;
        setAccessStore(data);
      }
    } catch (err) {
      console.error('Failed to fetch access control state:', err);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccessState();
  }, [fetchAccessState]);

  const handleToggleGlobalAccessControl = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/access-control/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (res.ok) {
        const data = await res.json();
        setAccessStore(data.store);
        triggerToast(
          enabled
            ? isFa
              ? 'کنترل دسترسی سطح دستگاه فعال شد (رد پیش‌فرض دستگاه‌های تاییدنشده)'
              : 'Device-level access control enabled (Strict Mode)'
            : isFa
            ? 'کنترل دسترسی غیرفعال شد (حالت عمومی استخر)'
            : 'Access control disabled (Public Pool Mode)'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeviceAction = async (
    identity: string,
    action: 'approve' | 'reject' | 'block' | 'unblock' | 'revoke' | 'disconnect' | 'set_limit',
    maxConnections?: number
  ) => {
    try {
      const res = await fetch('/api/access-control/device-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, action, maxConnections })
      });
      if (res.ok) {
        const data = await res.json();
        setAccessStore(data.store);
        triggerToast(
          isFa
            ? `عملیات "${action}" بر روی دستگاه ${identity} اعمال و ذخیره شد`
            : `Action "${action}" applied to ${identity}`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthorizeNewDevice = async (
    identity: string,
    maxConnections: number,
    customerMaxConnections: number,
    paymentTier: string
  ) => {
    try {
      const res = await fetch('/api/access-control/authorize-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity,
          maxConnections,
          customerMaxConnections,
          paymentTier
        })
      });
      const data = await res.json();
      if (!res.ok) {
        triggerToast(isFa ? data.errorFa : data.errorEn);
        return;
      }
      setAccessStore(data.store);
      triggerToast(
        isFa
          ? `دستگاه ${identity} با موفقیت مجاز شد`
          : `Authorized device ${identity}`
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCustomerLimit = async (
    wallet: string,
    maxSimultaneousConnections: number,
    paymentTier: string
  ) => {
    try {
      const res = await fetch('/api/access-control/customer-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          maxSimultaneousConnections,
          paymentTier,
          paymentVerified: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAccessStore(data.store);
        triggerToast(
          isFa
            ? `سقف اتصال همزمان مشتری ${wallet} به ${maxSimultaneousConnections} بروزرسانی شد`
            : `Updated customer "${wallet}" limit to ${maxSimultaneousConnections}`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateConnect = async (
    identity: string,
    ip: string,
    hashrate: number
  ): Promise<{ allowed: boolean; message: string }> => {
    try {
      const res = await fetch('/api/access-control/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, ip, hashrate })
      });
      const data = await res.json();
      if (data.store) {
        setAccessStore(data.store);
      }
      if (res.ok && data.allowed) {
        return {
          allowed: true,
          message: isFa
            ? `اتصال مجاز شد: نشست فعال برای ${identity} برقرار گردید.`
            : `Connection ALLOWED: Active session established for ${identity}.`
        };
      }
      return {
        allowed: false,
        message: isFa ? data.reasonFa : data.reasonEn
      };
    } catch (err) {
      return {
        allowed: false,
        message: isFa ? 'خطا در ارتباط با سرور' : 'Server communication error'
      };
    }
  };

  const pendingRequestCount = useMemo(
    () =>
      Object.values(accessStore.devices).filter((d) => d.authStatus === 'pending')
        .length,
    [accessStore]
  );

  const activeProxy = useMemo(
    () => proxies.find((p) => p.id === selectedProxyId) || proxies[0],
    [proxies, selectedProxyId]
  );

  const getProxyLabel = (p: ProxyPort) => (isFa ? p.labelFa : p.labelEn);

  const filteredSidebarProxies = useMemo(() => {
    if (!sidebarSearch.trim()) return proxies;
    const q = sidebarSearch.toLowerCase();
    return proxies.filter(
      (p) =>
        p.coin.toLowerCase().includes(q) ||
        p.labelEn.toLowerCase().includes(q) ||
        p.labelFa.toLowerCase().includes(q) ||
        String(p.listenPort).includes(q) ||
        p.algorithm.toLowerCase().includes(q)
    );
  }, [proxies, sidebarSearch]);

  const uniqueWallets = useMemo(() => {
    const set = new Set<string>();
    activeProxy.workers.forEach((w) => set.add(w.walletAddress));
    return Array.from(set);
  }, [activeProxy]);

  const getProxyWorkerIdentity = useCallback(
    (worker: MinerWorker, coin: string) => {
      const cleanWallet = worker.walletAddress.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_') || 'wallet1';
      const cleanWorker = coin.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '') || 'worker1';
      const cleanDevice = worker.deviceName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'device1';
      return `${cleanWallet}.${cleanWorker}.${cleanDevice}`;
    },
    []
  );

  const getWorkerEffectiveState = useCallback(
    (worker: MinerWorker, coin: string): 'enabled' | 'disabled' | 'blocked' => {
      if (worker.adminState) return worker.adminState;
      const identity = getProxyWorkerIdentity(worker, coin);
      const serverDev = accessStore.devices[identity];
      if (serverDev) {
        if (serverDev.authStatus === 'blocked') return 'blocked';
        if (serverDev.authStatus === 'revoked' || serverDev.authStatus === 'rejected') return 'disabled';
        if (serverDev.authStatus === 'approved' && serverDev.connectionStatus === 'connected') return 'enabled';
      }
      return worker.status === 'online' ? 'enabled' : 'disabled';
    },
    [accessStore.devices, getProxyWorkerIdentity]
  );

  const handleProxyWorkerStateChange = async (
    worker: MinerWorker,
    targetState: 'enabled' | 'disabled' | 'blocked'
  ) => {
    const identity = getProxyWorkerIdentity(worker, activeProxy.coin);
    const ts = new Date().toTimeString().slice(0, 8);
    const restoredHashrate =
      targetState === 'enabled'
        ? worker.avg15mHashrate > 0
          ? worker.avg15mHashrate
          : worker.localHashrate > 0
          ? worker.localHashrate
          : 185.0
        : 0;
    const restoredFeeHashrate =
      targetState === 'enabled'
        ? Number(((restoredHashrate * worker.feeRatePercent) / 100).toFixed(2))
        : 0;

    const logLine =
      targetState === 'enabled'
        ? `[${ts}] [ADMIN] Device ENABLED (${identity}) — Stratum session authorized & active`
        : targetState === 'disabled'
        ? `[${ts}] [ADMIN] Device DISABLED (${identity}) — Active Stratum session terminated immediately`
        : `[${ts}] [ADMIN] Device BLOCKED (${identity}) — Immediate disconnect & future reconnects denied`;

    setProxies((prev) =>
      prev.map((p) => {
        if (p.id !== activeProxy.id) return p;
        const updatedWorkers = p.workers.map((w) => {
          if (w.id !== worker.id) return w;
          const nextWorker: MinerWorker = {
            ...w,
            status: targetState === 'enabled' ? 'online' : 'offline',
            adminState: targetState,
            currentHashrate: restoredHashrate,
            currentFeeHashrate: restoredFeeHashrate,
            connections: targetState === 'enabled' ? Math.max(1, w.connections || 1) : 0,
            disconnectCount:
              targetState === 'enabled' ? w.disconnectCount : w.disconnectCount + 1,
            logs: [...w.logs, logLine]
          };
          if (inspectedWorker && inspectedWorker.id === w.id) {
            setInspectedWorker(nextWorker);
          }
          return nextWorker;
        });

        const onlineCount = updatedWorkers.filter((w) => w.status === 'online').length;
        const offlineCount = updatedWorkers.length - onlineCount;
        const totalHash = Number(
          updatedWorkers.reduce((sum, w) => sum + w.currentHashrate, 0).toFixed(2)
        );

        return {
          ...p,
          workers: updatedWorkers,
          onlineDevices: onlineCount,
          offlineDevices: offlineCount,
          currentHashrate: p.status === 'running' ? totalHash : 0
        };
      })
    );

    const serverAction =
      targetState === 'enabled'
        ? 'enable'
        : targetState === 'disabled'
        ? 'disable'
        : 'block';

    try {
      const res = await fetch('/api/access-control/device-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity,
          action: serverAction,
          ip: worker.ip,
          hashrate: restoredHashrate,
          unit: activeProxy.unit === 'P' ? 'T' : activeProxy.unit
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.store) {
          setAccessStore(data.store);
        }
      }
    } catch (err) {
      console.error('Failed to sync worker state with server access control:', err);
    }

    triggerToast(
      targetState === 'enabled'
        ? isFa
          ? `دستگاه ${worker.deviceName} فعال شد و اتصال برقرار گردید`
          : `Device ${worker.deviceName} enabled and connected`
        : targetState === 'disabled'
        ? isFa
          ? `دستگاه ${worker.deviceName} غیرفعال و اتصال آن قطع شد`
          : `Device ${worker.deviceName} disabled and disconnected`
        : isFa
        ? `دستگاه ${worker.deviceName} مسدود شد و دسترسی آن قطع گردید`
        : `Device ${worker.deviceName} blocked and disconnected immediately`
    );
  };

  const filteredWorkers = useMemo(() => {
    return activeProxy.workers.filter((w) => {
      const effState = getWorkerEffectiveState(w, activeProxy.coin);
      if (deviceFilter === 'online' && effState !== 'enabled') return false;
      if (deviceFilter === 'offline' && effState !== 'disabled') return false;
      if (deviceFilter === 'blocked' && effState !== 'blocked') return false;
      if (walletFilter !== 'all' && w.walletAddress !== walletFilter) return false;
      if (workerSearch.trim()) {
        const q = workerSearch.toLowerCase();
        return (
          w.deviceName.toLowerCase().includes(q) ||
          w.walletAddress.toLowerCase().includes(q) ||
          w.ip.toLowerCase().includes(q) ||
          w.firmware.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeProxy, deviceFilter, walletFilter, workerSearch, getWorkerEffectiveState]);

  const walletAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        wallet: string;
        online: number;
        offline: number;
        currentHashrate: number;
        avg24hHashrate: number;
        validShares: number;
        feeShares: number;
      }
    >();
    activeProxy.workers.forEach((w) => {
      const existing = map.get(w.walletAddress) || {
        wallet: w.walletAddress,
        online: 0,
        offline: 0,
        currentHashrate: 0,
        avg24hHashrate: 0,
        validShares: 0,
        feeShares: 0
      };
      if (w.status === 'online') existing.online += 1;
      else existing.offline += 1;
      existing.currentHashrate += w.currentHashrate;
      existing.avg24hHashrate += w.avg24hHashrate;
      existing.validShares += w.validShares;
      existing.feeShares += w.feeShares;
      map.set(w.walletAddress, existing);
    });
    return Array.from(map.values());
  }, [activeProxy]);

  const totalOnlineMiners = useMemo(
    () => proxies.reduce((acc, p) => acc + (p.status === 'running' ? p.onlineDevices : 0), 0),
    [proxies]
  );

  const totalOfflineMiners = useMemo(
    () => proxies.reduce((acc, p) => acc + p.offlineDevices, 0),
    [proxies]
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(key);
    setTimeout(() => setCopiedCommand(null), 1800);
  };

  const handleToggleProxyStatus = (proxyId: string) => {
    setProxies((prev) =>
      prev.map((p) => {
        if (p.id !== proxyId) return p;
        const nextStatus = p.status === 'running' ? 'stopped' : 'running';
        return {
          ...p,
          status: nextStatus,
          currentHashrate: nextStatus === 'running' ? (p.avg15mHashrate || 450) : 0
        };
      })
    );
    triggerToast(
      isFa ? 'وضعیت اجرای پورت پروکسی بروزرسانی شد' : 'Updated proxy port runtime state'
    );
  };

  const handleDeleteProxy = (proxyId: string) => {
    if (proxies.length <= 1) {
      triggerToast(
        isFa ? 'حداقل یک پورت پروکسی باید فعال بماند' : 'At least one proxy port must remain'
      );
      return;
    }
    const remaining = proxies.filter((p) => p.id !== proxyId);
    setProxies(remaining);
    if (selectedProxyId === proxyId) {
      setSelectedProxyId(remaining[0].id);
    }
    triggerToast(isFa ? 'پورت پروکسی حذف شد' : 'Proxy port removed');
  };

  const openEditProxyModal = (proxy: ProxyPort) => {
    setEditingProxy(proxy);
    setFormCoin(proxy.coin);
    setFormLabel(isFa ? proxy.labelFa : proxy.labelEn);
    setFormAlgorithm(proxy.algorithm);
    setFormListenPort(String(proxy.listenPort));
    setFormProtocol(proxy.protocol);
    setFormTargetPool(proxy.targetPool);
    setFormTargetPort(String(proxy.targetPort));
    setFormBackupPool(proxy.backupPool);
    setFormFeeRate(String(proxy.feeRatePercent));
    setFormFeeWallet(proxy.feeWallet);
    setShowCreateProxyModal(true);
  };

  const openNewProxyModal = () => {
    setEditingProxy(null);
    setFormCoin('BTC');
    setFormLabel(isFa ? 'خط اختصاصی جدید BTC' : 'BTC Dedicated Line');
    setFormAlgorithm('SHA256');
    setFormListenPort(String(Math.floor(2010 + Math.random() * 4000)));
    setFormProtocol('SSL');
    setFormTargetPool('btc.f2pool.com');
    setFormTargetPort('1314');
    setFormBackupPool('stratum.antpool.com:3333');
    setFormFeeRate('1.20');
    setFormFeeWallet('bitlite_vault.devfee');
    setShowCreateProxyModal(true);
  };

  const handleSaveProxyForm = (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = Math.max(1, Math.min(65535, Number(formListenPort) || 2008));
    const targetPortNum = Math.max(1, Math.min(65535, Number(formTargetPort) || 3333));
    const feeNum = Math.max(0, Math.min(50, Number(formFeeRate) || 0));

    if (editingProxy) {
      setProxies((prev) =>
        prev.map((p) =>
          p.id === editingProxy.id
            ? {
                ...p,
                coin: formCoin,
                labelEn: formLabel || `${formCoin}-${portNum}`,
                labelFa: formLabel || `${formCoin}-${portNum}`,
                algorithm: formAlgorithm,
                icon: COIN_ICON_MAP[formCoin] || '/image/icon-btc.png',
                listenPort: portNum,
                protocol: formProtocol,
                targetPool: formTargetPool,
                targetPort: targetPortNum,
                backupPool: formBackupPool,
                feeRatePercent: feeNum,
                feeWallet: formFeeWallet
              }
            : p
        )
      );
      triggerToast(isFa ? 'تنظیمات پورت با موفقیت ذخیره شد' : 'Port configuration updated');
    } else {
      const newId = `${formCoin.toLowerCase()}-${portNum}-${Date.now()}`;
      const newProxy: ProxyPort = {
        id: newId,
        coin: formCoin,
        labelEn: formLabel || `${formCoin} [${portNum}]`,
        labelFa: formLabel || `${formCoin} [${portNum}]`,
        algorithm: formAlgorithm,
        unit: formCoin === 'LTC' || formCoin === 'ETC+ZIL' ? 'G' : 'T',
        icon: COIN_ICON_MAP[formCoin] || '/image/icon-btc.png',
        listenPort: portNum,
        protocol: formProtocol,
        targetPool: formTargetPool,
        targetPort: targetPortNum,
        backupPool: formBackupPool,
        feeRatePercent: feeNum,
        feeWallet: formFeeWallet,
        feeWorkerName: `bitlite_${formCoin.toLowerCase()}_fee`,
        status: 'running',
        onlineDevices: 1,
        offlineDevices: 0,
        currentHashrate: 210.5,
        avg15mHashrate: 208.0,
        avg4hHashrate: 209.4,
        avg24hHashrate: 208.9,
        feeHashrate15m: Number(((208 * feeNum) / 100).toFixed(2)),
        invalidHashrate15m: 0,
        series: activeProxy.series,
        workers: [
          {
            id: `w-${Date.now()}`,
            deviceName: '192x168x10x101',
            walletAddress: formFeeWallet.split('.')[0] || 'bitlite_miner01',
            status: 'online',
            currentHashrate: 210.5,
            avg15mHashrate: 208.0,
            avg4hHashrate: 209.4,
            avg24hHashrate: 208.9,
            currentFeeHashrate: Number(((210.5 * feeNum) / 100).toFixed(2)),
            avg15mFeeHashrate: Number(((208.0 * feeNum) / 100).toFixed(2)),
            avg4hFeeHashrate: Number(((209.4 * feeNum) / 100).toFixed(2)),
            avg24hFeeHashrate: Number(((208.9 * feeNum) / 100).toFixed(2)),
            localHashrate: 211.0,
            validShares: 1240,
            invalidShares: 0,
            feeShares: Math.round((1240 * feeNum) / 100),
            firmware: 'cgminer/4.11.1',
            difficulty: '2.25P - 140.73T',
            disconnectCount: 0,
            feeRatePercent: feeNum,
            algorithm: formAlgorithm,
            latencyMs: 49,
            ip: '223.104.238.180',
            connections: 1,
            connectedAt: '2026-10-28 11:42:00',
            lastShareAt: '2026-10-28 11:43:10',
            lastJobAt: '2026-10-28 11:43:15',
            logs: [
              `[11:42:00] Port ${portNum} (${formProtocol}) initialized -> ${formTargetPool}:${targetPortNum}`
            ]
          }
        ]
      };
      setProxies((prev) => [newProxy, ...prev]);
      setSelectedProxyId(newId);
      triggerToast(isFa ? 'پورت پروکسی جدید ایجاد شد' : 'New proxy port created');
    }
    setShowCreateProxyModal(false);
  };

  const handleApplyHotFee = (e: React.FormEvent) => {
    e.preventDefault();
    const nextFee = Math.max(0, Math.min(50, Number(hotFeeValue) || 0));
    setProxies((prev) =>
      prev.map((p) => {
        if (p.id !== activeProxy.id) return p;
        return {
          ...p,
          feeRatePercent: nextFee,
          feeWallet: hotFeeWallet || p.feeWallet,
          feeHashrate15m: Number(((p.avg15mHashrate * nextFee) / 100).toFixed(2)),
          workers: p.workers.map((w) => ({
            ...w,
            feeRatePercent: nextFee,
            currentFeeHashrate: Number(((w.currentHashrate * nextFee) / 100).toFixed(2))
          }))
        };
      })
    );
    setShowHotFeeModal(false);
    triggerToast(
      isFa
        ? `بروزرسانی آنی انجام شد: نرخ کارمزد پورت [${activeProxy.listenPort}] به ${nextFee}% تغییر یافت`
        : `Hot-updated port [${activeProxy.listenPort}] fee rate to ${nextFee}%`
    );
  };

  const handleExportPortsJson = () => {
    const exportPayload = proxies.map((p) => ({
      coin: p.coin,
      labelEn: p.labelEn,
      labelFa: p.labelFa,
      algorithm: p.algorithm,
      listenPort: p.listenPort,
      protocol: p.protocol,
      targetPool: p.targetPool,
      targetPort: p.targetPort,
      backupPool: p.backupPool,
      feeRatePercent: p.feeRatePercent,
      feeWallet: p.feeWallet
    }));
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitlite-ports-${APP_VERSION}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(isFa ? 'فایل تنظیمات پورت‌ها خروجی گرفته شد' : 'Exported port configurations');
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'coin,label,algorithm,listenPort,protocol,targetPool,targetPort,backupPool,feeRatePercent,feeWallet\n' +
      'BTC,BTC Main Line,SHA256,2001,TCP,btc.f2pool.com,1314,stratum.antpool.com:3333,1.16,bitlite_vault.devfee\n' +
      'LTC,LTC Scrypt Line,SCRYPT,3333,BLC,ltc.viabtc.io,3333,ltc.f2pool.com:8888,1.00,ltc1qbitlitedevfeewallet01\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bitlite-port-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(isFa ? 'قالب اکسل/CSV پورت‌ها دانلود شد' : 'Downloaded CSV/Excel port template');
  };

  const handleExecuteWorkerConsole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedWorker || !workerConsoleInput.trim()) return;
    const cmd = workerConsoleInput.trim();
    const timestamp = new Date().toTimeString().slice(0, 8);
    const responseLine =
      cmd === 'ping'
        ? `[${timestamp}] PONG from ${inspectedWorker.ip} (${inspectedWorker.latencyMs}ms)`
        : cmd === 'reconnect'
        ? `[${timestamp}] Sent stratum client.reconnect to ${inspectedWorker.deviceName}`
        : `[${timestamp}] Executed "${cmd}" on ${inspectedWorker.deviceName} -> OK (status=nominal)`;

    const updatedLogs = [...inspectedWorker.logs, `> ${cmd}`, responseLine];
    setInspectedWorker({ ...inspectedWorker, logs: updatedLogs });
    setProxies((prev) =>
      prev.map((p) =>
        p.id !== activeProxy.id
          ? p
          : {
              ...p,
              workers: p.workers.map((w) =>
                w.id === inspectedWorker.id ? { ...w, logs: updatedLogs } : w
              )
            }
      )
    );
    setWorkerConsoleInput('');
  };

  const handleExecutePortConsole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portConsoleCmd.trim()) return;
    const cmd = portConsoleCmd.trim();
    const ts = new Date().toTimeString().slice(0, 8);
    let reply = `[${ts}] OK — Executed '${cmd}' on port ${activeProxy.listenPort}`;
    if (cmd.toLowerCase() === 'status') {
      reply = `[${ts}] Port ${activeProxy.listenPort} (${activeProxy.protocol}): ${activeProxy.onlineDevices} online, ${activeProxy.currentHashrate}${activeProxy.unit}/s, Fee=${activeProxy.feeRatePercent}%`;
    } else if (cmd.toLowerCase() === 'flush') {
      reply = `[${ts}] Cleared stale socket descriptors and refreshed upstream pool DNS (${activeProxy.targetPool})`;
    }
    setPortConsoleHistory((prev) => [...prev, `$ ${cmd}`, reply]);
    setPortConsoleCmd('');
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    const newNode: PoolNodeItem = {
      id: `node-${Date.now()}`,
      coin: nodeCoin,
      mergedCoinEn: nodeMerged || undefined,
      mergedCoinFa: nodeMerged || undefined,
      algorithm: nodeAlgo,
      icon: COIN_ICON_MAP[nodeCoin] || '/image/icon-btc.png',
      nodePort: Number(nodePort) || 3339,
      stratumUrl: `stratum+tcp://node.bitlitesystem.io:${nodePort}`,
      dailyYieldPerUnit: '$ 0.0610 / T',
      coinPriceUsd: '$ 93,450.00 USD',
      poolHashrate: '3.20 EH/s',
      networkHashrate: '874.36 EH/s',
      blockHeight: 867422,
      lastBlockFoundEn: 'Just now',
      lastBlockFoundFa: 'هم‌اکنون',
      totalRevenueBtc: 0.01250000,
      estimatedUsd: 1168.12,
      paidAmount: 0.01000000,
      unpaidAmount: 0.00250000,
      connectedMiners: 18,
      feePercent: Number(nodeFee) || 0.8,
      status: 'synced'
    };
    setPoolNodes((prev) => [newNode, ...prev]);
    setShowCreateNodeModal(false);
    triggerToast(isFa ? 'نود اختصاصی استخر راه‌اندازی شد' : 'Self-hosted pool node deployed');
  };

  // SVG Chart helper for activeProxy
  const maxHashrate = useMemo(() => {
    const vals = activeProxy.series.map((s) => s.validHashrate);
    return Math.max(...vals, 100) * 1.15;
  }, [activeProxy]);

  const maxShares = useMemo(() => {
    const vals = activeProxy.series.map((s) => s.validShares);
    return Math.max(...vals, 50) * 1.15;
  }, [activeProxy]);

  const buildPolyline = (
    key: 'validHashrate' | 'invalidHashrate' | 'feeHashrate',
    height: number,
    width: number
  ) => {
    const pts = activeProxy.series;
    if (!pts.length) return '';
    return pts
      .map((pt, idx) => {
        const x = (idx / Math.max(1, pts.length - 1)) * width;
        const y = height - (pt[key] / maxHashrate) * (height - 18) - 6;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div
      dir={isFa ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#0B0E17] text-slate-100 flex flex-col"
    >
      {/* Toast Notification */}
      {settingsSavedToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-lg border border-indigo-400/30 text-xs font-medium">
          <Check className="w-4 h-4 shrink-0" />
          <span>{settingsSavedToast}</span>
        </div>
      )}

      {/* TOP BAR CONTRACT: 3 Zones (Brand, 5 Nav Links, 1 Primary Action) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#101422] border-b border-slate-800/80">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setWorkspace('proxy');
          }}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          BitLite System
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium overflow-x-auto">
          <button
            onClick={() => setWorkspace('proxy')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              workspace === 'proxy'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {isFa ? 'پروکسی استخر' : 'Pool Proxy'}
          </button>
          <button
            onClick={() => setWorkspace('access')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              workspace === 'access'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {isFa ? 'کنترل دسترسی' : 'Access Control'}
          </button>
          <button
            onClick={() => setWorkspace('node')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              workspace === 'node'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {isFa ? 'نود استخر' : 'Pool Nodes'}
          </button>
          <button
            onClick={() => setWorkspace('algorithms')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              workspace === 'algorithms'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {isFa ? 'الگوریتم‌ها' : 'Algorithms'}
          </button>
          <button
            onClick={() => setWorkspace('cli')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              workspace === 'cli'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {isFa ? 'نصب و CLI' : 'Deploy & CLI'}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={openNewProxyModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isFa ? 'ایجاد پروکسی جدید' : 'Create Proxy'}
          </button>
        </div>
      </header>

      {/* WORKSPACE SUB-TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-2.5 bg-[#0E121E] border-b border-slate-800/70 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Access Control Status & Pending Requests Button */}
          <button
            onClick={() => setWorkspace('access')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              accessStore.accessControlEnabled
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-950'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>
              {accessStore.accessControlEnabled
                ? isFa
                  ? 'کنترل دسترسی دستگاه: فعال'
                  : 'Device Access Control: ON'
                : isFa
                ? 'کنترل دسترسی: غیرفعال (عمومی)'
                : 'Device Access Control: Public'}
            </span>
            {pendingRequestCount > 0 && (
              <span className="ms-1 font-mono font-bold text-amber-300">
                ({pendingRequestCount} {isFa ? 'در انتظار' : 'Pending'})
              </span>
            )}
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isFa ? 'تنظیمات امنیتی و سیستم' : 'Security & Settings'}</span>
            {!totpEnabled && (
              <span className="mx-1 text-amber-400 font-mono">!</span>
            )}
          </button>

          <button
            onClick={handleExportPortsJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>{isFa ? 'خروجی تنظیمات پورت‌ها' : 'Export Ports'}</span>
          </button>

          <button
            onClick={handleDownloadCsvTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isFa ? 'دانلود قالب درون‌ریزی پورت' : 'Port Import Template'}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <div className="hidden xl:flex items-center gap-2 font-mono text-xs" dir="ltr">
            <span>BitLite v{APP_VERSION}</span>
            <span aria-hidden="true">·</span>
            <span>
              {isFa ? 'آنلاین' : 'Online'}:{' '}
              <strong className="text-emerald-400 tabular-nums">{totalOnlineMiners}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isFa ? 'آفلاین' : 'Offline'}:{' '}
              <strong className="text-amber-400 tabular-nums">{totalOfflineMiners}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
            <button
              onClick={() => setLang('fa')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'fa'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              فارسی
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'en'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* WORKSPACE: DEVICE-LEVEL ACCESS CONTROL */}
      {workspace === 'access' && (
        <AccessControlPanel
          lang={lang}
          store={accessStore}
          loading={accessLoading}
          onRefresh={fetchAccessState}
          onToggleGlobal={handleToggleGlobalAccessControl}
          onDeviceAction={handleDeviceAction}
          onAuthorizeNew={handleAuthorizeNewDevice}
          onUpdateCustomerLimit={handleUpdateCustomerLimit}
          onSimulateConnect={handleSimulateConnect}
        />
      )}

      {/* MAIN WORKSPACE VIEWPORT: POOL PROXY */}
      {workspace === 'proxy' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* SIDEBAR: Proxy Ports & Coin Lines */}
          <aside className="lg:col-span-3 xl:col-span-2 bg-[#0E121E] border-x border-slate-800/80 flex flex-col">
            <div className="p-3.5 border-b border-slate-800/80 space-y-2.5">
              <button
                onClick={openNewProxyModal}
                className="w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFa ? 'ایجاد پورت پروکسی جدید' : 'Create New Proxy'}</span>
              </button>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder={isFa ? 'جستجوی ارز یا پورت...' : 'Filter coin / port...'}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900/90 border border-slate-800 rounded-md text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
              {filteredSidebarProxies.map((proxy) => {
                const isSelected = proxy.id === activeProxy.id;
                const displayHash =
                  proxy.currentHashrate >= 1000
                    ? `${(proxy.currentHashrate / 1000).toFixed(2)}P`
                    : `${proxy.currentHashrate.toFixed(2)}${proxy.unit}`;

                return (
                  <button
                    key={proxy.id}
                    onClick={() => setSelectedProxyId(proxy.id)}
                    className={`w-full text-start px-3.5 py-3 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 text-white'
                        : 'hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={proxy.icon}
                        alt={proxy.coin}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/image/icon-btc.png';
                        }}
                        className="w-7 h-7 rounded-full object-contain bg-slate-900 p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-100 truncate">
                          {proxy.coin}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {isFa ? 'هش‌ریت / دستگاه' : 'Hash / Workers'} · :{proxy.listenPort}
                        </div>
                      </div>
                    </div>

                    <div className="text-end shrink-0 font-mono text-xs tabular-nums" dir="ltr">
                      <div
                        className={
                          proxy.status === 'running' ? 'text-slate-100 font-medium' : 'text-slate-500'
                        }
                      >
                        {proxy.status === 'running' ? displayHash : '0.00M'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <span className="text-emerald-400">{proxy.onlineDevices}</span>
                        <span> / </span>
                        <span>{proxy.offlineDevices}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* System Telemetry Footer inside Sidebar */}
            <div className="p-3.5 border-t border-slate-800/80 bg-[#0B0E17]/70 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>{isFa ? 'نسخه سامانه' : 'Version'}</span>
                <span className="font-mono text-indigo-400 font-semibold tabular-nums" dir="ltr">
                  v{APP_VERSION}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isFa ? 'مدت فعالیت سرویس' : 'Uptime'}</span>
                <span className="font-mono text-slate-200 tabular-nums" dir="ltr">
                  11d 04h 22m
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isFa ? 'سیستم‌عامل' : 'OS'}</span>
                <span className="font-mono text-slate-200" dir="ltr">
                  Linux 22.04 Ubuntu
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isFa ? 'بار سیستم (LA)' : 'System Load'}</span>
                <span className="font-mono text-emerald-400 tabular-nums" dir="ltr">
                  0.13, 0.15, 0.10
                </span>
              </div>
            </div>
          </aside>

          {/* CENTER + RIGHT MAIN CONTENT */}
          <main className="lg:col-span-9 xl:col-span-10 p-5 space-y-5 overflow-y-auto">
            {/* TOP ROW: Dual Synchronized Hashrate & Share Telemetry Charts + Port Summary Card */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
              {/* Left 8 cols: Live Pool Hashrate & Share Bar Chart */}
              <div className="xl:col-span-8 bg-[#121626] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {isFa
                        ? 'پایش لحظه‌ای هش‌ریت و سهام استخر'
                        : 'Real-Time Pool Hashrate & Shares'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono" dir="ltr">
                      [{activeProxy.coin} :{activeProxy.listenPort} · {activeProxy.algorithm}]
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                      {isFa ? 'هش‌ریت معتبر' : 'Valid Hashrate'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-orange-500 inline-block" />
                      {isFa ? 'نامعتبر' : 'Invalid'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-indigo-400 inline-block" />
                      {isFa ? 'هش‌ریت کارمزد' : 'Fee Hashrate'}
                    </span>
                  </div>
                </div>

                {/* Line Chart: Valid / Fee / Invalid Hashrate */}
                <div className="w-full h-36 bg-[#0D101D] rounded-lg border border-slate-800/60 p-2 relative">
                  <svg viewBox="0 0 720 120" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="validHashGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="30" x2="720" y2="30" stroke="#1E293B" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="720" y2="60" stroke="#1E293B" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="720" y2="90" stroke="#1E293B" strokeDasharray="3 3" />

                    {activeProxy.status === 'running' && (
                      <>
                        <polygon
                          points={`0,115 ${buildPolyline('validHashrate', 115, 720)} 720,115`}
                          fill="url(#validHashGrad)"
                        />
                        <polyline
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="2"
                          points={buildPolyline('validHashrate', 115, 720)}
                        />
                        <polyline
                          fill="none"
                          stroke="#818CF8"
                          strokeWidth="1.5"
                          points={buildPolyline('feeHashrate', 115, 720)}
                        />
                        <polyline
                          fill="none"
                          stroke="#F97316"
                          strokeWidth="1.2"
                          points={buildPolyline('invalidHashrate', 115, 720)}
                        />
                      </>
                    )}
                  </svg>
                </div>

                {/* Share Histogram Bar Chart */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>
                      {isFa ? 'توزیع سهام ارسال‌شده (۲۴ ساعت)' : 'Share Submissions (24h)'}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" />
                        {isFa ? 'سهام معتبر' : 'Valid Shares'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-orange-500 inline-block" />
                        {isFa ? 'سهام نامعتبر' : 'Stale/Invalid'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                        {isFa ? 'سهام کارمزد' : 'Fee Shares'}
                      </span>
                    </div>
                  </div>
                  <div
                    dir="ltr"
                    className="w-full h-24 bg-[#0D101D] rounded-lg border border-slate-800/60 px-3 pt-2 pb-1 flex items-end justify-between gap-1.5"
                  >
                    {activeProxy.series.map((pt, index) => {
                      const validH =
                        activeProxy.status === 'running'
                          ? Math.max(8, Math.round((pt.validShares / maxShares) * 64))
                          : 2;
                      const feeH =
                        activeProxy.status === 'running'
                          ? Math.max(3, Math.round((pt.feeShares / maxShares) * 64))
                          : 0;
                      return (
                        <div
                          key={`${pt.time}-${index}`}
                          className="flex-1 flex flex-col items-center group relative"
                        >
                          <div className="w-full flex flex-col items-center justify-end h-16">
                            {feeH > 0 && (
                              <div
                                style={{ height: `${feeH}px` }}
                                className="w-1.5 bg-emerald-400 rounded-t-xs"
                              />
                            )}
                            <div
                              style={{ height: `${validH}px` }}
                              className="w-1.5 bg-indigo-500/90 group-hover:bg-indigo-400 transition-colors"
                            />
                          </div>
                          {index % 4 === 0 && (
                            <span className="text-[10px] font-mono text-slate-500 mt-1 tabular-nums">
                              {pt.time}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right 4 cols: Port Control & Hashrate Averages Card */}
              <div className="xl:col-span-4 bg-[#121626] border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeProxy.icon}
                      alt={activeProxy.coin}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full bg-slate-900 p-1 object-contain"
                    />
                    <div>
                      <h2 className="text-base font-bold text-white">
                        {getProxyLabel(activeProxy)} - [{activeProxy.listenPort}]
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                        <span>{activeProxy.protocol}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            activeProxy.status === 'running'
                              ? 'text-emerald-400 font-medium font-sans'
                              : 'text-amber-400 font-medium font-sans'
                          }
                        >
                          {activeProxy.status === 'running'
                            ? isFa
                              ? 'پورت فعال و نرمال'
                              : 'Port Nominal'
                            : isFa
                            ? 'پورت متوقف‌شده'
                            : 'Port Stopped'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-sans">
                          {isFa ? 'کارمزد' : 'Fee'} {activeProxy.feeRatePercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabular Hashrate Breakdown */}
                <div className="my-4 space-y-2.5 text-xs border-y border-slate-800/80 py-3.5 font-mono tabular-nums">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">
                      {isFa ? 'هش‌ریت فعلی' : 'Current Hashrate'}:
                    </span>
                    <span className="text-emerald-400 font-semibold text-sm" dir="ltr">
                      {activeProxy.currentHashrate >= 1000
                        ? `${(activeProxy.currentHashrate / 1000).toFixed(2)}P`
                        : `${activeProxy.currentHashrate.toFixed(2)}${activeProxy.unit}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">
                      {isFa ? 'میانگین ۱۵ دقیقه' : '15m Average'}:
                    </span>
                    <div dir="ltr">
                      <span className="text-emerald-400">
                        {isFa ? 'معتبر ' : 'Valid '}
                        {activeProxy.avg15mHashrate >= 1000
                          ? `${(activeProxy.avg15mHashrate / 1000).toFixed(2)}P`
                          : `${activeProxy.avg15mHashrate.toFixed(2)}${activeProxy.unit}`}
                      </span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span className="text-indigo-400">
                        {isFa ? 'کارمزد ' : 'Fee '}
                        {activeProxy.feeHashrate15m.toFixed(2)}
                        {activeProxy.unit}
                      </span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span className="text-orange-400">
                        {isFa ? 'نامعتبر ' : 'Invalid '}
                        {activeProxy.invalidHashrate15m}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">
                      {isFa ? 'میانگین ۴ ساعت / ۲۴ ساعت' : '4h / 24h Average'}:
                    </span>
                    <span className="text-slate-200" dir="ltr">
                      {activeProxy.avg4hHashrate >= 1000
                        ? `${(activeProxy.avg4hHashrate / 1000).toFixed(2)}P`
                        : `${activeProxy.avg4hHashrate.toFixed(2)}${activeProxy.unit}`}{' '}
                      /{' '}
                      {activeProxy.avg24hHashrate >= 1000
                        ? `${(activeProxy.avg24hHashrate / 1000).toFixed(2)}P`
                        : `${activeProxy.avg24hHashrate.toFixed(2)}${activeProxy.unit}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">
                      {isFa ? 'استخر مقصد (Upstream)' : 'Upstream Pool'}:
                    </span>
                    <span className="text-slate-300 truncate max-w-[210px]" dir="ltr">
                      {activeProxy.targetPool}:{activeProxy.targetPort}
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openEditProxyModal(activeProxy)}
                      className="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isFa ? 'ویرایش تنظیمات پورت' : 'Edit Port Config'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setHotFeeValue(String(activeProxy.feeRatePercent));
                        setHotFeeWallet(activeProxy.feeWallet);
                        setShowHotFeeModal(true);
                      }}
                      className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isFa ? 'بروزرسانی آنی کارمزد' : 'Hot-Update Fee'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleToggleProxyStatus(activeProxy.id)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activeProxy.status === 'running'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      {activeProxy.status === 'running' ? (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>{isFa ? 'توقف پورت' : 'Stop Port'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>{isFa ? 'راه‌اندازی پورت' : 'Start Port'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteProxy(activeProxy.id)}
                      className="py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isFa ? 'حذف این پورت' : 'Delete Port'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: Worker Table / Wallet List / Port Details / Port Console */}
            <div className="bg-[#121626] border border-slate-800/90 rounded-xl overflow-hidden">
              {/* Sub-Navigation & Filter Bar */}
              <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1 p-1 bg-[#0B0E17] rounded-lg border border-slate-800">
                  <button
                    onClick={() => setProxySubTab('devices')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      proxySubTab === 'devices'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isFa ? 'مدیریت ماینرها' : 'Device Management'}
                  </button>
                  <button
                    onClick={() => setProxySubTab('wallets')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      proxySubTab === 'wallets'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isFa ? 'لیست کیف‌پول‌ها' : 'Wallet List'} ({uniqueWallets.length})
                  </button>
                  <button
                    onClick={() => setProxySubTab('portInfo')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      proxySubTab === 'portInfo'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isFa ? 'اطلاعات پورت' : 'Port Details'}
                  </button>
                  <button
                    onClick={() => setProxySubTab('console')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      proxySubTab === 'console'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isFa ? 'کنسول پورت' : 'Port Console'}
                  </button>
                </div>

                {proxySubTab === 'devices' && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Online / Disabled / Blocked Filter Buttons */}
                    <div className="flex items-center gap-1 bg-[#0B0E17] p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        onClick={() => setDeviceFilter('all')}
                        className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          deviceFilter === 'all'
                            ? 'bg-slate-800 text-white font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isFa ? 'همه دستگاه‌ها' : 'All'} ({activeProxy.workers.length})
                      </button>
                      <button
                        onClick={() => setDeviceFilter('online')}
                        className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          deviceFilter === 'online'
                            ? 'bg-emerald-950/80 text-emerald-300 font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isFa ? 'فعال / آنلاین' : 'Enabled'} (
                        {
                          activeProxy.workers.filter(
                            (w) => getWorkerEffectiveState(w, activeProxy.coin) === 'enabled'
                          ).length
                        }
                        )
                      </button>
                      <button
                        onClick={() => setDeviceFilter('offline')}
                        className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          deviceFilter === 'offline'
                            ? 'bg-amber-950/80 text-amber-300 font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isFa ? 'غیرفعال / آفلاین' : 'Disabled'} (
                        {
                          activeProxy.workers.filter(
                            (w) => getWorkerEffectiveState(w, activeProxy.coin) === 'disabled'
                          ).length
                        }
                        )
                      </button>
                      <button
                        onClick={() => setDeviceFilter('blocked')}
                        className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          deviceFilter === 'blocked'
                            ? 'bg-rose-950/80 text-rose-300 font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isFa ? 'مسدود شده' : 'Blocked'} (
                        {
                          activeProxy.workers.filter(
                            (w) => getWorkerEffectiveState(w, activeProxy.coin) === 'blocked'
                          ).length
                        }
                        )
                      </button>
                    </div>

                    {/* Wallet Filter Select */}
                    <select
                      value={walletFilter}
                      onChange={(e) => setWalletFilter(e.target.value)}
                      className="bg-[#0B0E17] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">
                        {isFa ? 'فیلتر بر اساس کیف‌پول (همه)' : 'Filter by Wallet (All)'}
                      </option>
                      {uniqueWallets.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>

                    {/* Worker Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={workerSearch}
                        onChange={(e) => setWorkerSearch(e.target.value)}
                        placeholder={
                          isFa ? 'جستجوی نام ماینر / IP / فرم‌ور...' : 'Search worker / IP...'
                        }
                        className="pl-8 pr-3 py-1.5 bg-[#0B0E17] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TAB 1: DEVICE MANAGEMENT TABLE */}
              {proxySubTab === 'devices' && (
                <div className="overflow-x-auto">
                  {filteredWorkers.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                      <div className="text-sm font-medium text-slate-300">
                        {isFa
                          ? 'هیچ دستگاه ماینری با فیلترهای انتخابی یافت نشد'
                          : 'No connected miner devices match the active filter'}
                      </div>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {isFa
                          ? `آدرس استخر ماینر خود را بر روی stratum+${activeProxy.protocol.toLowerCase()}://<server-ip>:${activeProxy.listenPort} تنظیم کنید تا آمار لحظه‌ای نمایش داده شود.`
                          : `Point your ASIC/GPU miners to stratum+${activeProxy.protocol.toLowerCase()}://<server-ip>:${activeProxy.listenPort} to stream live telemetry.`}
                      </p>
                      <button
                        onClick={() => {
                          setDeviceFilter('all');
                          setWalletFilter('all');
                          setWorkerSearch('');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors cursor-pointer"
                      >
                        {isFa ? 'پاکسازی فیلترها' : 'Reset Filters'}
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-start border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 bg-[#0E121E]/60">
                          <th className="py-3 px-4">{isFa ? 'نام دستگاه' : 'Worker Name'}</th>
                          <th className="py-3 px-4">{isFa ? 'آدرس کیف‌پول' : 'Wallet'}</th>
                          <th className="py-3 px-4 text-end">
                            {isFa ? 'هش‌ریت فعلی' : 'Current Hash'}
                          </th>
                          <th className="py-3 px-4 text-end">
                            {isFa ? 'میانگین 15m / 24h' : '15m / 24h Avg'}
                          </th>
                          <th className="py-3 px-4 text-end">
                            {isFa ? 'هش‌ریت کارمزد' : 'Fee Hash (Rate)'}
                          </th>
                          <th className="py-3 px-4 text-end">
                            {isFa ? 'سهام معتبر / نامعتبر' : 'Valid / Invalid'}
                          </th>
                          <th className="py-3 px-4">{isFa ? 'مدل / کرنل' : 'Firmware'}</th>
                          <th className="py-3 px-4 text-end">
                            {isFa ? 'پینگ / آدرس IP' : 'Latency / IP'}
                          </th>
                          <th className="py-3 px-4 text-end">
                            {isFa ? 'آخرین ارسال سهام' : 'Last Share'}
                          </th>
                          <th className="py-3 px-4 text-end">{isFa ? 'عملیات' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-xs font-mono tabular-nums">
                        {filteredWorkers.map((worker) => {
                          const effState = getWorkerEffectiveState(worker, activeProxy.coin);
                          return (
                            <tr
                              key={worker.id}
                              onClick={() => {
                                setInspectedWorker(worker);
                                setWorkerModalTab('desc');
                              }}
                              className={`transition-colors cursor-pointer ${
                                effState === 'blocked'
                                  ? 'bg-rose-950/15 hover:bg-rose-950/25'
                                  : effState === 'disabled'
                                  ? 'bg-amber-950/10 hover:bg-slate-800/40'
                                  : 'hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="py-3 px-4 font-sans font-semibold text-white">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      effState === 'enabled'
                                        ? 'text-emerald-400 text-xs font-mono'
                                        : effState === 'blocked'
                                        ? 'text-rose-400 text-xs font-mono'
                                        : 'text-amber-400 text-xs font-mono'
                                    }
                                  >
                                    {effState === 'enabled'
                                      ? isFa
                                        ? '[فعال]'
                                        : '[ENABLED]'
                                      : effState === 'blocked'
                                      ? isFa
                                        ? '[مسدود]'
                                        : '[BLOCKED]'
                                      : isFa
                                      ? '[غیرفعال]'
                                      : '[DISABLED]'}
                                  </span>
                                  <span className="font-mono">{worker.deviceName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-indigo-400" dir="ltr">
                                {worker.walletAddress}
                              </td>
                              <td
                                className={`py-3 px-4 text-end font-semibold ${
                                  effState === 'enabled' ? 'text-emerald-400' : 'text-slate-500'
                                }`}
                                dir="ltr"
                              >
                                {worker.currentHashrate.toFixed(2)}
                                {activeProxy.unit}
                              </td>
                              <td className="py-3 px-4 text-end text-slate-300" dir="ltr">
                                {worker.avg15mHashrate.toFixed(2)}
                                {activeProxy.unit} / {worker.avg24hHashrate.toFixed(2)}
                                {activeProxy.unit}
                              </td>
                              <td className="py-3 px-4 text-end text-indigo-300" dir="ltr">
                                {worker.currentFeeHashrate.toFixed(2)}
                                {activeProxy.unit} ({worker.feeRatePercent}%)
                              </td>
                              <td className="py-3 px-4 text-end" dir="ltr">
                                <span className="text-slate-100">
                                  {(worker.validShares / 1000).toFixed(2)}k
                                </span>
                                <span className="text-slate-500"> / </span>
                                <span className="text-orange-400">{worker.invalidShares}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-300 font-sans" dir="ltr">
                                {worker.firmware}
                              </td>
                              <td className="py-3 px-4 text-end text-slate-300" dir="ltr">
                                {worker.latencyMs}ms · {worker.ip}
                              </td>
                              <td className="py-3 px-4 text-end text-slate-400" dir="ltr">
                                {worker.lastShareAt}
                              </td>
                              <td
                                className="py-3 px-4 text-end font-sans"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleProxyWorkerStateChange(worker, 'enabled')}
                                    disabled={effState === 'enabled'}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                                      effState === 'enabled'
                                        ? 'bg-emerald-950/40 text-emerald-500/50 border border-emerald-800/30 cursor-not-allowed'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                                    }`}
                                  >
                                    {isFa ? 'فعال' : 'Enable'}
                                  </button>
                                  <button
                                    onClick={() => handleProxyWorkerStateChange(worker, 'disabled')}
                                    disabled={effState === 'disabled'}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                                      effState === 'disabled'
                                        ? 'bg-amber-950/40 text-amber-500/50 border border-amber-800/30 cursor-not-allowed'
                                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer'
                                    }`}
                                  >
                                    {isFa ? 'غیرفعال' : 'Disable'}
                                  </button>
                                  {effState === 'blocked' ? (
                                    <button
                                      onClick={() => handleProxyWorkerStateChange(worker, 'enabled')}
                                      className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                    >
                                      {isFa ? 'رفع مسدودی' : 'Unblock'}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleProxyWorkerStateChange(worker, 'blocked')}
                                      className="px-2 py-1 rounded bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                    >
                                      {isFa ? 'مسدود' : 'Block'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setInspectedWorker(worker);
                                      setWorkerModalTab('desc');
                                    }}
                                    className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    {isFa ? 'جزئیات' : 'Inspect'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 2: WALLET LIST */}
              {proxySubTab === 'wallets' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 bg-[#0E121E]/60">
                        <th className="py-3 px-4">{isFa ? 'کیف‌پول / زیرحساب' : 'Wallet / Subaccount'}</th>
                        <th className="py-3 px-4 text-end">{isFa ? 'دستگاه آنلاین / آفلاین' : 'Online / Offline'}</th>
                        <th className="py-3 px-4 text-end">{isFa ? 'مجموع هش‌ریت فعلی' : 'Current Hashrate'}</th>
                        <th className="py-3 px-4 text-end">{isFa ? 'میانگین ۲۴ ساعته' : '24h Average'}</th>
                        <th className="py-3 px-4 text-end">{isFa ? 'کل سهام معتبر' : 'Valid Shares'}</th>
                        <th className="py-3 px-4 text-end">{isFa ? 'کل سهام کارمزد' : 'Fee Shares'}</th>
                        <th className="py-3 px-4 text-end">{isFa ? 'عملیات' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs font-mono tabular-nums">
                      {walletAggregates.map((item) => (
                        <tr key={item.wallet} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 text-indigo-400 font-semibold" dir="ltr">
                            {item.wallet}
                          </td>
                          <td className="py-3 px-4 text-end" dir="ltr">
                            <span className="text-emerald-400">{item.online}</span> /{' '}
                            <span className="text-amber-400">{item.offline}</span>
                          </td>
                          <td className="py-3 px-4 text-end text-emerald-400 font-semibold" dir="ltr">
                            {item.currentHashrate.toFixed(2)}
                            {activeProxy.unit}
                          </td>
                          <td className="py-3 px-4 text-end text-slate-300" dir="ltr">
                            {item.avg24hHashrate.toFixed(2)}
                            {activeProxy.unit}
                          </td>
                          <td className="py-3 px-4 text-end text-slate-200" dir="ltr">
                            {item.validShares.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-end text-indigo-300" dir="ltr">
                            {item.feeShares.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-end font-sans">
                            <button
                              onClick={() => {
                                setWalletFilter(item.wallet);
                                setProxySubTab('devices');
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              {isFa ? 'مشاهده ماینرها' : 'Filter Workers'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: PORT DETAILS */}
              {proxySubTab === 'portInfo' && (
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  <div className="bg-[#0E121E] border border-slate-800 rounded-lg p-4 space-y-2.5">
                    <div className="text-slate-400 font-semibold">
                      {isFa ? 'آدرس اتصال ماینرها (Stratum Endpoint)' : 'Miner Connection Endpoint'}
                    </div>
                    <div
                      dir="ltr"
                      className="font-mono text-indigo-300 bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">
                        stratum+{activeProxy.protocol.toLowerCase()}://node.bitlitesystem.io:{activeProxy.listenPort}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(
                            `stratum+${activeProxy.protocol.toLowerCase()}://node.bitlitesystem.io:${activeProxy.listenPort}`,
                            'stratum-url'
                          )
                        }
                        className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                      >
                        {copiedCommand === 'stratum-url' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="text-slate-500">
                      {isFa
                        ? 'فرمت نام کاربری ماینر برای کنترل دسترسی: Wallet.Worker.Device (مثال: wallet1.worker1.device101).'
                        : 'Miner username format for device-level access control: Wallet.Worker.Device (e.g. wallet1.worker1.device101).'}
                    </div>
                  </div>

                  <div className="bg-[#0E121E] border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="text-slate-400 font-semibold">
                      {isFa ? 'استخر مقصد و بکاپ خودکار' : 'Upstream Pool & Failover'}
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">
                        {isFa ? 'استخر اصلی:' : 'Primary:'}
                      </span>
                      <span className="text-slate-200" dir="ltr">
                        {activeProxy.targetPool}:{activeProxy.targetPort}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">
                        {isFa ? 'استخر پشتیبان:' : 'Failover:'}
                      </span>
                      <span className="text-slate-200" dir="ltr">
                        {activeProxy.backupPool}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">
                        {isFa ? 'پروتکل امنیتی:' : 'Protocol:'}
                      </span>
                      <span className="text-emerald-400" dir="ltr">
                        {activeProxy.protocol}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0E121E] border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="text-slate-400 font-semibold">
                      {isFa ? 'سیاست کارمزد اختصاصی (DevFee)' : 'Custom DevFee Policy'}
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">
                        {isFa ? 'درصد کارمزد:' : 'Fee Rate:'}
                      </span>
                      <span className="text-indigo-400 font-semibold" dir="ltr">
                        {activeProxy.feeRatePercent}%
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">
                        {isFa ? 'کیف‌پول دریافت کارمزد:' : 'Fee Wallet:'}
                      </span>
                      <span className="text-slate-200 truncate max-w-[180px]" dir="ltr">
                        {activeProxy.feeWallet}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">
                        {isFa ? 'نام ماینر کارمزد:' : 'Fee Worker:'}
                      </span>
                      <span className="text-slate-300" dir="ltr">
                        {activeProxy.feeWorkerName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PORT CONSOLE */}
              {proxySubTab === 'console' && (
                <div className="p-4 space-y-3">
                  <div
                    dir="ltr"
                    className="bg-[#090C14] border border-slate-800 rounded-lg p-3.5 h-48 overflow-y-auto font-mono text-xs space-y-1.5 text-slate-300"
                  >
                    {portConsoleHistory.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.startsWith('$')
                            ? 'text-indigo-400 font-semibold'
                            : 'text-emerald-400/90'
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleExecutePortConsole} className="flex gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={portConsoleCmd}
                      onChange={(e) => setPortConsoleCmd(e.target.value)}
                      placeholder={
                        isFa
                          ? 'دستور کنسول پورت را وارد کنید (مثلاً: status, flush, reload-fee)...'
                          : 'Enter port command, e.g. status, flush, reload-fee...'
                      }
                      className="flex-1 bg-[#0B0E17] border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {isFa ? 'ارسال دستور' : 'Execute'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* WORKSPACE 2: SELF-HOSTED POOL NODES */}
      {workspace === 'node' && (
        <div className="flex-1 p-6 max-w-[1440px] w-full mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-5 bg-gradient-to-br from-[#181E34] to-[#111525] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">
                    {isFa
                      ? 'مجموع درآمد نودهای استخر اختصاصی (تخمینی USD)'
                      : 'Pool Node Total Revenue (Est. USD)'}
                  </div>
                  <div className="text-3xl font-bold text-white font-mono tabular-nums mt-1" dir="ltr">
                    $ 23,558.42
                  </div>
                </div>
                <img
                  src="/image/icon-btc.png"
                  alt="BTC"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono tabular-nums">
                <div>
                  <span className="text-slate-400 font-sans block">
                    {isFa ? 'پرداخت‌شده (Paid BTC)' : 'Paid BTC'}
                  </span>
                  <span className="text-emerald-400 font-semibold text-sm" dir="ltr">
                    0.24770671 BTC
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block">
                    {isFa ? 'موجودی در انتظار تسویه' : 'Unpaid Balance'}
                  </span>
                  <span className="text-indigo-300 font-semibold text-sm" dir="ltr">
                    0.00857200 BTC
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block">
                    {isFa ? 'نسخه نود BitLite' : 'BitLite Node'}
                  </span>
                  <span className="text-slate-200 font-semibold text-sm" dir="ltr">
                    v{APP_VERSION}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#121626] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isFa
                      ? 'ماتریس نودهای استخر اختصاصی (BitLite Full-Node Gateway)'
                      : 'BitLite Self-Hosted Mining Pool Nodes'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isFa
                      ? 'سرور خود را به یک نود مستقل استخر ماینینگ با قابلیت استخراج ترکیبی (BTC+FB / LTC+DOGE+BEL) و کنترل دسترسی سطح دستگاه تبدیل کنید.'
                      : 'Turn your server into an independent mining pool node with merged mining and device-level access control.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateNodeModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isFa ? 'راه‌اندازی نود استخر جدید' : 'Deploy Pool Node'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-800/80 text-xs font-mono tabular-nums">
                <div>
                  <div className="text-slate-400 font-sans">
                    {isFa ? 'نودهای فعال استخر' : 'Active Pool Nodes'}
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">{poolNodes.length}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">
                    {isFa ? 'کل ماینرهای متصل' : 'Connected ASICs'}
                  </div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {poolNodes.reduce((acc, n) => acc + n.connectedMiners, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">
                    {isFa ? 'وضعیت همگام‌سازی بلاک' : 'Block Sync State'}
                  </div>
                  <div className="text-lg font-bold text-indigo-400 mt-0.5" dir="ltr">
                    100% Synced
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pool Nodes Table */}
          <div className="bg-[#121626] border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {isFa ? 'لیست نودهای استخر در حال اجرا' : 'Active Pool Nodes'}
              </h3>
              <span className="text-xs text-slate-400">
                {isFa
                  ? 'محافظت‌شده با گارد کنترل دسترسی سطح دستگاه BitLite v1.0.0'
                  : 'Protected by BitLite v1.0.0 Device-Level Access Control Guard'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-[#0E121E]/60">
                    <th className="py-3.5 px-5">{isFa ? 'ارز / الگوریتم' : 'Coin / Algorithm'}</th>
                    <th className="py-3.5 px-5">{isFa ? 'آدرس Stratum نود' : 'Node Stratum URL'}</th>
                    <th className="py-3.5 px-5 text-end">{isFa ? 'درآمد روزانه / قیمت' : 'Daily Yield / Price'}</th>
                    <th className="py-3.5 px-5 text-end">{isFa ? 'هش‌ریت استخر / شبکه' : 'Pool / Network Hash'}</th>
                    <th className="py-3.5 px-5 text-end">{isFa ? 'ارتفاع بلاک / آخرین بلاک' : 'Block Height'}</th>
                    <th className="py-3.5 px-5 text-end">{isFa ? 'کارمزد نود / ماینرها' : 'Fee / Miners'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono tabular-nums">
                  {poolNodes.map((node) => (
                    <tr key={node.id} className="hover:bg-slate-800/30">
                      <td className="py-4 px-5 font-sans">
                        <div className="flex items-center gap-3">
                          <img
                            src={node.icon}
                            alt={node.coin}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{node.coin}</span>
                              {(isFa ? node.mergedCoinFa : node.mergedCoinEn) && (
                                <span className="text-emerald-400 text-xs font-medium">
                                  {isFa ? node.mergedCoinFa : node.mergedCoinEn}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {node.algorithm}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-indigo-300" dir="ltr">
                        {node.stratumUrl}
                      </td>
                      <td className="py-4 px-5 text-end" dir="ltr">
                        <div className="text-white font-semibold">{node.dailyYieldPerUnit}</div>
                        <div className="text-[11px] text-slate-400">{node.coinPriceUsd}</div>
                      </td>
                      <td className="py-4 px-5 text-end" dir="ltr">
                        <div className="text-emerald-400 font-semibold">{node.poolHashrate}</div>
                        <div className="text-[11px] text-slate-400">{node.networkHashrate}</div>
                      </td>
                      <td className="py-4 px-5 text-end">
                        <div className="text-slate-200" dir="ltr">
                          #{node.blockHeight.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans">
                          {isFa ? node.lastBlockFoundFa : node.lastBlockFoundEn}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-end">
                        <div className="text-indigo-400 font-semibold" dir="ltr">
                          {node.feePercent}%
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans">
                          {node.connectedMiners} {isFa ? 'دستگاه آنلاین' : 'miners'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 3: SUPPORTED ALGORITHMS & COINS */}
      {workspace === 'algorithms' && (
        <div className="flex-1 p-6 max-w-[1440px] w-full mx-auto space-y-6">
          <div className="bg-[#121626] border border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isFa
                  ? 'ماتریس الگوریتم‌ها و ارزهای قابل استخراج در BitLite System v1.0.0'
                  : 'BitLite System v1.0.0 Supported Mining Algorithms & Coins'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isFa
                  ? 'پشتیبانی کامل از ۲۲ الگوریتم استخراج شامل SHA256، ETHASH، SCRYPT و KHEAVYHASH با قابلیت رمزنگاری و فشرده‌سازی لینک BLC.'
                  : 'BitLite System supports 22+ PoW algorithms with Stratum TCP/SSL forwarding, DevFee routing, and BLC link encryption.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {['btc', 'bch', 'etc', 'ethw', 'ltc', 'kaspa', 'kda', 'cfx', 'zec', 'rvn', 'erg'].map(
                (c) => (
                  <img
                    key={c}
                    src={`/image/icon-${c}.png`}
                    alt={c}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full bg-slate-900 p-0.5"
                  />
                )
              )}
            </div>
          </div>

          <div className="bg-[#121626] border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-[#0E121E]/60">
                  <th className="py-3.5 px-5">{isFa ? 'نام الگوریتم' : 'Algorithm'}</th>
                  <th className="py-3.5 px-5">{isFa ? 'ارزهای پشتیبانی‌شده' : 'Supported Coins'}</th>
                  <th className="py-3.5 px-5">{isFa ? 'پروتکل‌های پیشنهادی' : 'Protocols'}</th>
                  <th className="py-3.5 px-5">{isFa ? 'رمزنگاری و فشرده‌سازی BLC' : 'BLC Encryption'}</th>
                  <th className="py-3.5 px-5 text-end">{isFa ? 'عملیات سریع' : 'Quick Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {SUPPORTED_ALGORITHMS.map((item) => (
                  <tr key={item.algorithm} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-5 font-mono font-semibold text-indigo-400" dir="ltr">
                      {item.algorithm}
                    </td>
                    <td className="py-3.5 px-5 text-slate-200 font-mono" dir="ltr">
                      {item.coins.join(' · ')}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-300" dir="ltr">
                      {item.recommendedProtocol}
                    </td>
                    <td className="py-3.5 px-5 text-emerald-400">
                      {item.blcEncrypted
                        ? isFa
                          ? 'پشتیبانی از رمزنگاری و فشرده‌سازی BLC'
                          : 'BLC Encryption & Compression'
                        : 'Standard'}
                    </td>
                    <td className="py-3.5 px-5 text-end">
                      <button
                        onClick={() => {
                          setEditingProxy(null);
                          setFormCoin(item.coins[0] || 'BTC');
                          setFormAlgorithm(item.algorithm);
                          setFormLabel(
                            isFa
                              ? `خط اختصاصی ${item.coins[0]} (${item.algorithm})`
                              : `${item.coins[0]} ${item.algorithm} Line`
                          );
                          setShowCreateProxyModal(true);
                        }}
                        className="px-3 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isFa ? 'ایجاد پورت این الگوریتم' : 'Create Port'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WORKSPACE 4: LINUX INSTALLER & CLI TOOLKIT */}
      {workspace === 'cli' && (
        <div className="flex-1 p-6 max-w-[1440px] w-full mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: One-line deployment commands & 24-option interactive script simulator */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-[#121626] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {isFa
                        ? 'اسکریپت نصب خودکار چندسکویی (Linux / ARM / ARMV7)'
                        : 'Multi-Platform One-Line Deployment Scripts'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isFa
                        ? 'پیشنهادشده برای Ubuntu 22.04+ به همراه سرویس systemd و بهینه‌سازی شبکه TCP BBR.'
                        : 'Recommended on Ubuntu 22.04+ with built-in systemd service & TCP BBR sysctl optimization.'}
                    </p>
                  </div>
                </div>

                {[
                  {
                    key: 'x86',
                    label: isFa
                      ? 'اسکریپت نصب استاندارد لینوکس (x86_64)'
                      : 'Linux x86_64 Standard Installer',
                    cmd: 'bash <(curl -s -L https://cdn.bitlitesystem.io/release/main/install.sh)'
                  },
                  {
                    key: 'mirror',
                    label: isFa
                      ? 'آدرس میرور پرسرعت نصب (Mirror)'
                      : 'High-Speed Mirror Installer',
                    cmd: 'bash <(curl -s -L -k https://mirror.bitlitesystem.io/release/main/install.sh)'
                  },
                  {
                    key: 'arm64',
                    label: isFa ? 'اسکریپت نصب معماری ARM64' : 'ARM64 Architecture Installer',
                    cmd: 'bash <(curl -s -L https://cdn.bitlitesystem.io/release/main/arm-install.sh)'
                  },
                  {
                    key: 'armv7',
                    label: isFa ? 'اسکریپت نصب معماری ARMV7' : 'ARMV7 Architecture Installer',
                    cmd: 'bash <(curl -s -L https://cdn.bitlitesystem.io/release/main/armv7-install.sh)'
                  }
                ].map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="text-xs font-medium text-slate-300">{item.label}</div>
                    <div
                      dir="ltr"
                      className="flex items-center justify-between gap-2 bg-[#090C14] border border-slate-800 rounded-lg px-3.5 py-2.5 font-mono text-xs text-emerald-400"
                    >
                      <span className="truncate">{item.cmd}</span>
                      <button
                        onClick={() => handleCopy(item.cmd, item.key)}
                        className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                      >
                        {copiedCommand === item.key ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive install.sh Menu Simulator */}
              <div className="bg-[#121626] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    {isFa
                      ? 'شبیه‌ساز منوی مدیریت ترمینال BitLite System (۲۴ عملیات)'
                      : 'BitLite System Interactive Operations Menu (24 Actions)'}
                  </h3>
                  <span className="text-xs font-mono text-emerald-400" dir="ltr">
                    Service status: Running (v{APP_VERSION})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 1, fa: '۱. نصب BitLite System', en: '1. Install BitLite' },
                    { id: 2, fa: '۲. بروزرسانی نسخه', en: '2. Update Version' },
                    { id: 4, fa: '۴. شروع سرویس', en: '4. Start Service' },
                    { id: 6, fa: '۶. راه‌اندازی مجدد', en: '6. Restart Service' },
                    { id: 7, fa: '۷. تغییر پورت وب', en: '7. Change Web Port' },
                    { id: 8, fa: '۸. بهینه‌سازی شبکه و BBR', en: '8. Raise ulimit & BBR' },
                    { id: 9, fa: '۹. تنظیم دسترسی HTTPS', en: '9. HTTPS Access' },
                    { id: 10, fa: '۱۰. فعال‌سازی پنل وب', en: '10. Enable Web UI' },
                    { id: 12, fa: '۱۲. اجرای خودکار (Autostart)', en: '12. Enable Autostart' },
                    { id: 20, fa: '۲۰. بازنشانی رمز عبور', en: '20. Reset Password' },
                    { id: 22, fa: '۲۲. نصب ابزار خط فرمان bitlite', en: '22. Install bitlite CLI' },
                    { id: 24, fa: '۲۴. مدیریت Control API', en: '24. Toggle Control API' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedInstallMenu(m.id)}
                      className={`px-3 py-2 rounded-lg border text-start font-medium transition-colors cursor-pointer ${
                        selectedInstallMenu === m.id
                          ? 'bg-indigo-600/25 border-indigo-500 text-white'
                          : 'bg-[#0B0E17] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {isFa ? m.fa : m.en}
                    </button>
                  ))}
                </div>

                <div
                  dir="ltr"
                  className="bg-[#080B12] border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-1.5"
                >
                  <div className="text-indigo-400">
                    +----------------------------------------------------------------+
                  </div>
                  <div className="text-white font-bold">
                    {'  '}BitLite System {APP_VERSION} — Selected Menu [{selectedInstallMenu}]
                  </div>
                  <div className="text-indigo-400">
                    +----------------------------------------------------------------+
                  </div>
                  {selectedInstallMenu === 1 && (
                    <>
                      <div className="text-emerald-400">
                        Program started successfully, Version: {APP_VERSION}
                      </div>
                      <div>Backend access URL: https://127.0.0.1:{webAccessPort}</div>
                      <div>Default username:   {adminUser}</div>
                      <div>Default password:   {adminPass}</div>
                    </>
                  )}
                  {selectedInstallMenu === 8 && (
                    <>
                      <div className="text-emerald-400">
                        Global network and file descriptor optimization completed (33 sysctl keys).
                      </div>
                      <div>fs.file-max = 1048576 | net.ipv4.tcp_congestion_control = bbr</div>
                      <div>net.core.somaxconn = 65535 | DefaultLimitNOFILE = 1048576</div>
                    </>
                  )}
                  {selectedInstallMenu === 22 && (
                    <>
                      <div className="text-emerald-400">BitLite CLI tool installed successfully</div>
                      <div>CLI path: /root/bitlitesystem/BitLiteCLI-{APP_VERSION}</div>
                      <div>Command launcher: /usr/local/bin/bitlite (start | stop | restart)</div>
                    </>
                  )}
                  {selectedInstallMenu !== 1 &&
                    selectedInstallMenu !== 8 &&
                    selectedInstallMenu !== 22 && (
                      <>
                        <div className="text-emerald-400">
                          Executing menu action #{selectedInstallMenu} on systemd unit bitliteservice.service...
                        </div>
                        <div>WorkingDirectory=/root/bitlitesystem/ | LimitNOFILE=65535 | Status=Active</div>
                      </>
                    )}
                </div>
              </div>
            </div>

            {/* Right 5 cols: Live BitLite System CLI Terminal Overview */}
            <div className="lg:col-span-5 bg-[#121626] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {isFa
                    ? 'ترمینال خط فرمان BitLite CLI و بهینه‌سازی هسته'
                    : 'BitLite CLI Terminal & Kernel Optimization'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isFa
                    ? 'نام کاربری پیش‌فرض پنل bitlite_admin است. پس از اولین ورود، رمز عبور و پورت دسترسی وب را از بخش تنظیمات امنیتی تغییر دهید.'
                    : 'Default admin username is bitlite_admin. Update your password and web access port immediately after first login.'}
                </p>
              </div>

              <div
                dir="ltr"
                className="rounded-lg border border-slate-800 bg-[#070A10] p-4 font-mono text-xs text-slate-300 space-y-2 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="text-slate-500">root@bitlite-node:~# bitlite status</div>
                  <div className="text-indigo-400">
                    ========================================================
                  </div>
                  <div className="text-white font-bold">
                    BitLite System CLI v{APP_VERSION} (Engine v{APP_VERSION})
                  </div>
                  <div className="text-indigo-400">
                    ========================================================
                  </div>
                  <div className="text-emerald-400">
                    [OK] Service unit:      bitliteservice.service (active)
                  </div>
                  <div>[OK] Web Console Port:  {webAccessPort} (HTTPS TLS 1.3)</div>
                  <div>
                    [OK] Access Control:    {accessStore.accessControlEnabled ? 'STRICT (Wallet.Worker.Device)' : 'PUBLIC'}
                  </div>
                  <div>[OK] Active Proxies:    {proxies.length} ports listening</div>
                  <div>[OK] Connected ASICs:   {totalOnlineMiners} online / {totalOfflineMiners} offline</div>
                  <div>[OK] BLC Link Tunnel:   AES-256-GCM + LZ4 Compression</div>
                  <div>[OK] Kernel TCP Stack:  BBR + fq (file-max=1048576)</div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  Commands: <span className="text-indigo-300">bitlite start</span> |{' '}
                  <span className="text-indigo-300">bitlite stop</span> |{' '}
                  <span className="text-indigo-300">bitlite restart</span> |{' '}
                  <span className="text-indigo-300">bitlite status</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200">
                {isFa
                  ? 'نکته امنیتی: تمامی مجوزهای سطح دستگاه (Wallet.Worker.Device)، لیست مسدودی و سقف اتصالات همزمان بر روی دیسک سرور ذخیره شده و پس از ری‌استارت حفظ می‌شوند.'
                  : 'Security Note: All device-level permissions (Wallet.Worker.Device), blocks, and simultaneous connection limits are persisted on disk across restarts.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: WORKER / DEVICE INSPECTION MODAL */}
      {inspectedWorker && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161B2E] border border-slate-700/80 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5" dir="ltr">
                <span className="font-mono text-sm font-bold text-white">
                  {inspectedWorker.deviceName}
                </span>
                <span className="text-xs font-mono text-indigo-400">
                  ({inspectedWorker.walletAddress})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleProxyWorkerStateChange(inspectedWorker, 'enabled')}
                  disabled={getWorkerEffectiveState(inspectedWorker, activeProxy.coin) === 'enabled'}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    getWorkerEffectiveState(inspectedWorker, activeProxy.coin) === 'enabled'
                      ? 'bg-emerald-950/40 text-emerald-500/50 border border-emerald-800/30 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isFa ? 'فعال کردن' : 'Enable'}
                </button>
                <button
                  onClick={() => handleProxyWorkerStateChange(inspectedWorker, 'disabled')}
                  disabled={getWorkerEffectiveState(inspectedWorker, activeProxy.coin) === 'disabled'}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    getWorkerEffectiveState(inspectedWorker, activeProxy.coin) === 'disabled'
                      ? 'bg-amber-950/40 text-amber-500/50 border border-amber-800/30 cursor-not-allowed'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {isFa ? 'غیرفعال کردن' : 'Disable'}
                </button>
                <button
                  onClick={() =>
                    handleProxyWorkerStateChange(
                      inspectedWorker,
                      getWorkerEffectiveState(inspectedWorker, activeProxy.coin) === 'blocked'
                        ? 'enabled'
                        : 'blocked'
                    )
                  }
                  className="px-2.5 py-1 rounded bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-medium transition-colors cursor-pointer"
                >
                  {getWorkerEffectiveState(inspectedWorker, activeProxy.coin) === 'blocked'
                    ? isFa
                      ? 'رفع مسدودی'
                      : 'Unblock'
                    : isFa
                    ? 'مسدود کردن'
                    : 'Block'}
                </button>
                <button
                  onClick={() => setInspectedWorker(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Mini Hashrate & Share Chart inside Worker Modal */}
              <div className="bg-[#0D101D] border border-slate-800/80 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {isFa
                      ? 'نمودار هش‌ریت و سهام این ماینر'
                      : 'Worker Hashrate & Share Telemetry'}
                  </span>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="text-emerald-400">
                      — {isFa ? 'هش‌ریت معتبر' : 'Valid'}
                    </span>
                    <span className="text-orange-400">
                      — {isFa ? 'نامعتبر' : 'Invalid'}
                    </span>
                    <span className="text-indigo-400">
                      — {isFa ? 'کارمزد' : 'Fee'}
                    </span>
                  </div>
                </div>
                <svg viewBox="0 0 700 85" className="w-full h-20">
                  <polyline
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="2"
                    points="0,45 40,38 80,42 120,30 160,36 200,28 240,35 280,22 320,31 360,29 400,34 440,25 480,30 520,20 560,28 600,18 640,26 700,22"
                  />
                  <polyline
                    fill="none"
                    stroke="#818CF8"
                    strokeWidth="1.5"
                    points="0,78 100,77 200,78 300,76 400,78 500,77 600,78 700,77"
                  />
                </svg>
              </div>

              {/* Tabs: مشخصات دستگاه | لاگ‌های ماینر | کنسول تعاملی */}
              <div className="flex items-center gap-1 bg-[#0D101D] p-1 rounded-lg border border-slate-800 w-fit text-xs">
                <button
                  onClick={() => setWorkerModalTab('desc')}
                  className={`px-3.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    workerModalTab === 'desc'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isFa ? 'مشخصات دستگاه' : 'Description'}
                </button>
                <button
                  onClick={() => setWorkerModalTab('logs')}
                  className={`px-3.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    workerModalTab === 'logs'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isFa ? 'لاگ‌های دستگاه' : 'Device Logs'}
                </button>
                <button
                  onClick={() => setWorkerModalTab('console')}
                  className={`px-3.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    workerModalTab === 'console'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isFa ? 'کنسول' : 'Console'}
                </button>
              </div>

              {/* 4x6 Grid of 24 Telemetry Fields */}
              {workerModalTab === 'desc' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#111525] border border-slate-800/80 rounded-lg p-4 text-xs font-mono tabular-nums">
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'نام دستگاه:' : 'Device Name:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.deviceName}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'آدرس کیف‌پول:' : 'Wallet Address:'}
                    </div>
                    <div className="text-indigo-400 mt-0.5" dir="ltr">
                      {inspectedWorker.walletAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'سهام معتبر:' : 'Valid Shares:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {(inspectedWorker.validShares / 1000).toFixed(2)}k
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'سهام نامعتبر:' : 'Invalid Shares:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.invalidShares}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'هش‌ریت فعلی:' : 'Current Hashrate:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.currentHashrate.toFixed(2)}
                      {activeProxy.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'میانگین ۱۵ دقیقه:' : '15m Avg Hashrate:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.avg15mHashrate.toFixed(2)}
                      {activeProxy.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'میانگین ۴ ساعت:' : '4h Avg Hashrate:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.avg4hHashrate.toFixed(2)}
                      {activeProxy.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'میانگین ۲۴ ساعت:' : '24h Avg Hashrate:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.avg24hHashrate.toFixed(2)}
                      {activeProxy.unit}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'هش‌ریت کارمزد فعلی:' : 'Current Fee Hash:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.currentFeeHashrate.toFixed(2)}
                      {activeProxy.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'کارمزد ۱۵ دقیقه:' : '15m Fee Hash:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.avg15mFeeHashrate.toFixed(2)}
                      {activeProxy.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'کارمزد ۴ ساعت:' : '4h Fee Hash:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.avg4hFeeHashrate.toFixed(2)}
                      {activeProxy.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'کارمزد ۲۴ ساعت:' : '24h Fee Hash:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.avg24hFeeHashrate.toFixed(2)}
                      {activeProxy.unit}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'هش‌ریت گزارش‌شده:' : 'Reported Hashrate:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.localHashrate}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'مدل / کرنل:' : 'Miner / Kernel:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.firmware}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'سختی کار فعلی:' : 'Job Difficulty:'}
                    </div>
                    <div className="text-indigo-400 mt-0.5" dir="ltr">
                      {inspectedWorker.difficulty}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'دفعات قطعی ارتباط:' : 'Disconnect Count:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.disconnectCount}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'درصد کارمزد:' : 'Fee Ratio:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.feeRatePercent}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'الگوریتم:' : 'Algorithm:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.algorithm}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'تاخیر شبکه (Ping):' : 'Ping Latency:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.latencyMs} ms
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">IP:</div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.ip}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'زمان اتصال دستگاه:' : 'Connected At:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.connectedAt}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'آخرین ارسال سهام:' : 'Last Share At:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.lastShareAt}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'آخرین دریافت کار از استخر:' : 'Last Pool Job:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.lastJobAt}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-sans">
                      {isFa ? 'همزمانی (کانکشن):' : 'Concurrency:'}
                    </div>
                    <div className="text-slate-100 mt-0.5" dir="ltr">
                      {inspectedWorker.connections}
                    </div>
                  </div>
                </div>
              )}

              {workerModalTab === 'logs' && (
                <div
                  dir="ltr"
                  className="bg-[#090C14] border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-1.5 text-slate-300 max-h-60 overflow-y-auto"
                >
                  {inspectedWorker.logs.map((logLine, idx) => (
                    <div key={idx}>{logLine}</div>
                  ))}
                </div>
              )}

              {workerModalTab === 'console' && (
                <div className="space-y-3">
                  <div
                    dir="ltr"
                    className="bg-[#090C14] border border-slate-800 rounded-lg p-3.5 font-mono text-xs space-y-1 text-slate-300 h-44 overflow-y-auto"
                  >
                    {inspectedWorker.logs.map((logLine, idx) => (
                      <div key={idx}>{logLine}</div>
                    ))}
                  </div>
                  <form onSubmit={handleExecuteWorkerConsole} className="flex gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={workerConsoleInput}
                      onChange={(e) => setWorkerConsoleInput(e.target.value)}
                      placeholder={
                        isFa
                          ? 'دستور کنسول ماینر را وارد کنید (ping / reconnect / set-diff)...'
                          : 'Enter worker command (ping / reconnect / set-diff)...'
                      }
                      className="flex-1 bg-[#0B0E17] border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {isFa ? 'اجرا' : 'Run'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SECURITY & SYSTEM SETTINGS */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#131726] border border-slate-700/80 rounded-xl max-w-4xl w-full h-[600px] flex overflow-hidden shadow-2xl">
            {/* Settings Sidebar */}
            <div className="w-64 bg-[#0E121E] border-e border-slate-800 p-3.5 overflow-y-auto space-y-4 text-xs">
              <div>
                <div className="text-[11px] text-slate-500 px-2.5 mb-1.5">
                  {isFa ? 'تنظیمات پیشنهادی' : 'Recommended'}
                </div>
                <button
                  onClick={() => setSettingsCategory('2fa')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                    settingsCategory === '2fa'
                      ? 'bg-indigo-950/60 border-indigo-500/50 text-white font-medium'
                      : 'border-transparent text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span>{isFa ? 'تایید دو مرحله‌ای (2FA)' : 'Two-Factor Auth (2FA)'}</span>
                  {!totpEnabled && <span className="text-amber-400 font-mono">!</span>}
                </button>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 px-2.5 mb-1.5">
                  {isFa ? 'تنظیمات امنیتی' : 'Security Settings'}
                </div>
                <div className="space-y-1">
                  {(
                    [
                      { key: 'credentials', fa: 'نام کاربری و رمز عبور', en: 'Admin Credentials' },
                      { key: 'safe_url', fa: 'مسیر امن ورود به پنل', en: 'Safe Access Path' },
                      { key: '2fa', fa: 'تایید دو مرحله‌ای ورود', en: '2FA Authenticator' },
                      { key: 'https', fa: 'دسترسی امن HTTPS', en: 'HTTPS TLS Access' },
                      { key: 'session_ttl', fa: 'مدت اعتبار نشست (Session)', en: 'Session Expiration' },
                      { key: 'web_port', fa: 'پورت دسترسی وب', en: 'Web Console Port' }
                    ] as { key: SettingsCategory; fa: string; en: string }[]
                  ).map((item, idx) => (
                    <button
                      key={`${item.key}-${idx}`}
                      onClick={() => setSettingsCategory(item.key)}
                      className={`w-full text-start px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                        settingsCategory === item.key
                          ? 'bg-slate-800 text-white font-medium'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      {isFa ? item.fa : item.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 px-2.5 mb-1.5">
                  {isFa ? 'تنظیمات عمومی' : 'General Settings'}
                </div>
                <div className="space-y-1">
                  {(
                    [
                      { key: 'tls_cert', fa: 'گواهی SSL پورت‌های ماینینگ', en: 'Global Mining TLS Cert' },
                      { key: 'ip_blacklist', fa: 'لیست سیاه IP', en: 'IP Blacklist' },
                      { key: 'wallet_blacklist', fa: 'لیست سیاه کیف‌پول', en: 'Wallet Blacklist' },
                      { key: 'wallet_whitelist', fa: 'لیست سفید کیف‌پول', en: 'Wallet Whitelist' },
                      { key: 'offline_webhook', fa: 'هشدار قطعی ماینرها (Webhook)', en: 'Offline Webhook Alert' },
                      { key: 'kenc_key', fa: 'کلید اختصاصی رمزنگاری BLC', en: 'BLC Encryption Key' },
                      { key: 'quick_pools', fa: 'لیست استخرهای پیش‌فرض', en: 'Quick Pool Presets' }
                    ] as { key: SettingsCategory; fa: string; en: string }[]
                  ).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSettingsCategory(item.key)}
                      className={`w-full text-start px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                        settingsCategory === item.key
                          ? 'bg-slate-800 text-white font-medium'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      {isFa ? item.fa : item.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings Content Area */}
            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {settingsCategory === '2fa' &&
                        (isFa ? 'تایید دو مرحله‌ای ورود (2FA)' : 'Two-Factor Authentication (2FA)')}
                      {settingsCategory === 'credentials' &&
                        (isFa ? 'نام کاربری و رمز عبور مدیر' : 'Admin Account & Password')}
                      {settingsCategory === 'safe_url' &&
                        (isFa ? 'مسیر امن دسترسی به پنل' : 'Safe Admin URL Path')}
                      {settingsCategory === 'https' &&
                        (isFa ? 'دسترسی امن HTTPS به پنل' : 'HTTPS Backend TLS')}
                      {settingsCategory === 'session_ttl' &&
                        (isFa ? 'زمان انقضای نشست کاربری' : 'Session Timeout')}
                      {settingsCategory === 'web_port' &&
                        (isFa ? 'پورت دسترسی کنسول وب' : 'Web Console Port')}
                      {settingsCategory === 'tls_cert' &&
                        (isFa ? 'گواهی SSL سراسری پورت‌های ماینینگ' : 'Global Mining Port SSL Certificate')}
                      {settingsCategory === 'ip_blacklist' &&
                        (isFa ? 'قوانین لیست سیاه IP' : 'IP Blacklist Rules')}
                      {settingsCategory === 'wallet_blacklist' &&
                        (isFa ? 'لیست سیاه کیف‌پول' : 'Wallet Blacklist')}
                      {settingsCategory === 'wallet_whitelist' &&
                        (isFa ? 'لیست سفید کیف‌پول' : 'Wallet Whitelist')}
                      {settingsCategory === 'offline_webhook' &&
                        (isFa ? 'اعلان وب‌هوک قطعی ماینرها' : 'Miner Offline Webhook Notification')}
                      {settingsCategory === 'kenc_key' &&
                        (isFa ? 'کلید رمزنگاری اختصاصی لینک BLC' : 'BitLite BLC Custom Secret Key')}
                      {settingsCategory === 'quick_pools' &&
                        (isFa ? 'استخرهای آماده و سریع' : 'Quick Upstream Pool Presets')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {settingsCategory === '2fa'
                        ? isFa
                          ? 'محافظت از ورود به پنل و تغییرات حساس کارمزد با استفاده از Google Authenticator.'
                          : 'Protect console login and sensitive fee changes with Google Authenticator.'
                        : isFa
                        ? 'تغییرات بلافاصله در فایل پیکربندی BitLite System ذخیره و اعمال می‌شوند.'
                        : 'Changes are persisted immediately to the BitLite System runtime config.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="w-6 h-6 rounded-full bg-rose-500/80 hover:bg-rose-500 flex items-center justify-center text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {settingsCategory === '2fa' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 rounded-lg bg-[#1A2036] border border-slate-700/70 text-slate-200">
                      {totpEnabled
                        ? isFa
                          ? 'تایید دو مرحله‌ای Google Authenticator فعال است و تمامی تغییرات حساس محافظت می‌شوند.'
                          : 'Google Authenticator 2FA is active for login and fee rate updates.'
                        : isFa
                        ? 'تایید دو مرحله‌ای هنوز فعال نشده است. پیشنهاد می‌شود برای حفاظت از ورود و تنظیمات کارمزد، Google Authenticator را فعال نمایید.'
                        : '2FA is not enabled yet. We recommend Google Authenticator to protect login and sensitive actions.'}
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#1A2036] border border-slate-700/70 text-slate-300">
                      {isFa
                        ? 'پس از تولید بارکد، حتماً کلید پشتیبان را ذخیره کنید؛ همچنین دقیق بودن ساعت سرور (NTP) برای صحت کدهای یکبارمصرف ضروری است.'
                        : 'Back up your secret key before closing; ensure NTP server time sync is accurate.'}
                    </div>

                    <div className="p-4 rounded-xl bg-[#0E121E] border border-slate-800 space-y-4">
                      <div>
                        <label className="block text-slate-300 mb-1.5">
                          {isFa ? 'عنوان برنامه تاییدگر *' : 'Authenticator Title *'}
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={totpTitle}
                          onChange={(e) => setTotpTitle(e.target.value)}
                          className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1.5">
                          {isFa ? 'توضیحات تاییدگر *' : 'Authenticator Description *'}
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={totpDesc}
                          onChange={(e) => setTotpDesc(e.target.value)}
                          className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setTotpEnabled(!totpEnabled);
                          triggerToast(
                            !totpEnabled
                              ? isFa
                                ? 'تایید دو مرحله‌ای فعال شد'
                                : '2FA Enabled'
                              : isFa
                              ? 'تایید دو مرحله‌ای غیرفعال شد'
                              : '2FA Disabled'
                          );
                        }}
                        className="w-full py-2.5 rounded-lg bg-indigo-400 hover:bg-indigo-300 text-slate-950 font-semibold transition-colors cursor-pointer"
                      >
                        {totpEnabled
                          ? isFa
                            ? 'تایید دو مرحله‌ای فعال است (کلیک برای توقف)'
                            : 'Disable Two-Factor Authentication'
                          : isFa
                          ? 'فعال‌سازی تایید دو مرحله‌ای'
                          : 'Enable Two-Factor Authentication'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'credentials' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1.5">
                        {isFa ? 'نام کاربری مدیر سیستم' : 'Admin Username'}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1.5">
                        {isFa ? 'رمز عبور مدیر سیستم' : 'Admin Password'}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {settingsCategory === 'web_port' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1.5">
                        {isFa ? 'پورت کنسول وب (START_PORT)' : 'Web Console Port (START_PORT)'}
                      </label>
                      <input
                        type="number"
                        dir="ltr"
                        value={webAccessPort}
                        onChange={(e) => setWebAccessPort(e.target.value)}
                        className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {settingsCategory === 'kenc_key' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1.5">
                        {isFa
                          ? 'کلید رمزنگاری متقارن کلاینت محلی BLC'
                          : 'BitLite BLC Client Symmetric Encryption Key'}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={blcSecretKey}
                        onChange={(e) => setBlcSecretKey(e.target.value)}
                        className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3.5 py-2.5 text-emerald-400 font-mono"
                      />
                    </div>
                  </div>
                )}

                {(settingsCategory === 'ip_blacklist' ||
                  settingsCategory === 'wallet_blacklist' ||
                  settingsCategory === 'wallet_whitelist') && (
                  <div className="space-y-3 text-xs">
                    <label className="block text-slate-300">
                      {isFa ? 'در هر خط یک مورد وارد کنید:' : 'Enter one entry per line:'}
                    </label>
                    <textarea
                      rows={6}
                      dir="ltr"
                      value={
                        settingsCategory === 'ip_blacklist'
                          ? ipBlacklist
                          : settingsCategory === 'wallet_blacklist'
                          ? walletBlacklist
                          : walletWhitelist
                      }
                      onChange={(e) => {
                        if (settingsCategory === 'ip_blacklist') setIpBlacklist(e.target.value);
                        else if (settingsCategory === 'wallet_blacklist')
                          setWalletBlacklist(e.target.value);
                        else setWalletWhitelist(e.target.value);
                      }}
                      className="w-full bg-[#090C14] border border-slate-800 rounded-lg p-3.5 text-white font-mono"
                    />
                  </div>
                )}

                {(settingsCategory === 'safe_url' ||
                  settingsCategory === 'https' ||
                  settingsCategory === 'session_ttl' ||
                  settingsCategory === 'tls_cert' ||
                  settingsCategory === 'offline_webhook' ||
                  settingsCategory === 'quick_pools') && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1.5">
                        {isFa ? 'مقدار پیکربندی فعلی' : 'Configuration Value'}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={
                          settingsCategory === 'safe_url'
                            ? safePath
                            : settingsCategory === 'session_ttl'
                            ? `${sessionTtlHours} hours`
                            : settingsCategory === 'offline_webhook'
                            ? webhookUrl
                            : 'ENABLE_WEB_TLS=1 (TLS 1.3 ECDHE-RSA-AES256-GCM-SHA384)'
                        }
                        onChange={(e) => {
                          if (settingsCategory === 'safe_url') setSafePath(e.target.value);
                          if (settingsCategory === 'offline_webhook') setWebhookUrl(e.target.value);
                        }}
                        className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                >
                  {isFa ? 'بستن' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    triggerToast(isFa ? 'تنظیمات سیستم با موفقیت ذخیره شد' : 'Settings saved');
                    setShowSettingsModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  {isFa ? 'ذخیره تغییرات' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE / EDIT PROXY PORT MODAL */}
      {showCreateProxyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProxyForm}
            className="bg-[#131726] border border-slate-700/80 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProxy
                  ? isFa
                    ? `ویرایش پورت پروکسی [${editingProxy.listenPort}]`
                    : `Edit Proxy Port [${editingProxy.listenPort}]`
                  : isFa
                  ? 'ایجاد پورت پروکسی جدید'
                  : 'Create New Pool Proxy Port'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateProxyModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'ارز دیجیتال' : 'Coin'}
                </label>
                <select
                  value={formCoin}
                  onChange={(e) => setFormCoin(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  {Object.keys(COIN_ICON_MAP).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'الگوریتم (Algorithm)' : 'Algorithm'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={formAlgorithm}
                  onChange={(e) => setFormAlgorithm(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'عنوان / برچسب پورت' : 'Proxy Label'}
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder={isFa ? 'خط اختصاصی BTC' : 'BTC Dedicated Line'}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'پورت محلی (1-65535)' : 'Listen Port'}
                </label>
                <input
                  type="number"
                  dir="ltr"
                  value={formListenPort}
                  onChange={(e) => setFormListenPort(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'پروتکل اتصال' : 'Protocol'}
                </label>
                <select
                  value={formProtocol}
                  onChange={(e) => setFormProtocol(e.target.value as 'TCP' | 'SSL' | 'BLC')}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="TCP">TCP</option>
                  <option value="SSL">SSL (TLS 1.3)</option>
                  <option value="BLC">BLC (BitLite Encrypted)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'آدرس استخر مقصد' : 'Upstream Pool Host'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={formTargetPool}
                  onChange={(e) => setFormTargetPool(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'پورت استخر مقصد' : 'Upstream Port'}
                </label>
                <input
                  type="number"
                  dir="ltr"
                  value={formTargetPort}
                  onChange={(e) => setFormTargetPort(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'نرخ کارمزد اختصاصی (%)' : 'Custom Fee Rate (%)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  dir="ltr"
                  value={formFeeRate}
                  onChange={(e) => setFormFeeRate(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'کیف‌پول دریافت کارمزد' : 'Fee Wallet / Subaccount'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={formFeeWallet}
                  onChange={(e) => setFormFeeWallet(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateProxyModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                {isFa ? 'انصراف' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
              >
                {isFa ? 'ذخیره و راه‌اندازی پورت' : 'Save & Start Port'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: HOT-UPDATE FEE RATE MODAL */}
      {showHotFeeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleApplyHotFee}
            className="bg-[#131726] border border-slate-700/80 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isFa
                  ? `بروزرسانی آنی کارمزد [${activeProxy.coin} :${activeProxy.listenPort}]`
                  : `Hot-Update Fee Policy [:${activeProxy.listenPort}]`}
              </h3>
              <button
                type="button"
                onClick={() => setShowHotFeeModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-400">
              {isFa
                ? 'بروزرسانی آنی نرخ کارمزد بدون قطع اتصال فعلی ماینرها در ارسال کار بعدی اعمال می‌شود.'
                : 'Hot-updating fee rates applies on the next Stratum job broadcast without dropping connected ASIC sessions.'}
            </p>
            <div>
              <label className="block text-slate-300 mb-1">
                {isFa ? 'درصد کارمزد (%)' : 'Fee Rate Percentage (%)'}
              </label>
              <input
                type="number"
                step="0.01"
                dir="ltr"
                value={hotFeeValue}
                onChange={(e) => setHotFeeValue(e.target.value)}
                className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3.5 py-2.5 text-emerald-400 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">
                {isFa ? 'کیف‌پول / زیرحساب دریافت کارمزد' : 'Fee Recipient Wallet'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={hotFeeWallet}
                onChange={(e) => setHotFeeWallet(e.target.value)}
                className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3.5 py-2.5 text-white font-mono"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowHotFeeModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 cursor-pointer"
              >
                {isFa ? 'انصراف' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
              >
                {isFa ? 'اعمال بروزرسانی آنی' : 'Apply Hot Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 6: DEPLOY NEW SELF-HOSTED POOL NODE */}
      {showCreateNodeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNode}
            className="bg-[#131726] border border-slate-700/80 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isFa ? 'راه‌اندازی نود استخر اختصاصی' : 'Deploy Self-Hosted Pool Node'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateNodeModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'ارز اصلی نود' : 'Primary Coin'}
                </label>
                <select
                  value={nodeCoin}
                  onChange={(e) => setNodeCoin(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  <option value="BTC">BTC</option>
                  <option value="BCH">BCH</option>
                  <option value="LTC">LTC</option>
                  <option value="KASPA">KASPA</option>
                  <option value="ETC">ETC</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'پاداش استخراج ترکیبی' : 'Merged Mining Bonus'}
                </label>
                <input
                  type="text"
                  value={nodeMerged}
                  onChange={(e) => setNodeMerged(e.target.value)}
                  placeholder="+ FB Bonus / + DOGE"
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'پورت Stratum نود' : 'Node Stratum Port'}
                </label>
                <input
                  type="number"
                  dir="ltr"
                  value={nodePort}
                  onChange={(e) => setNodePort(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  {isFa ? 'کارمزد نود استخر (%)' : 'Pool Node Fee (%)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  dir="ltr"
                  value={nodeFee}
                  onChange={(e) => setNodeFee(e.target.value)}
                  className="w-full bg-[#090C14] border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateNodeModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 cursor-pointer"
              >
                {isFa ? 'انصراف' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
              >
                {isFa ? 'راه‌اندازی نود' : 'Deploy Node'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QUIET FOOTER */}
      <footer className="px-6 py-3 bg-[#090C14] border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3" dir="ltr">
          <span>BitLite System v{APP_VERSION} · MIT License</span>
          <span aria-hidden="true">·</span>
          <span>BLC Security Client v{APP_VERSION}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setWorkspace('proxy')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            {isFa ? 'پروکسی استخر' : 'Pool Proxy'}
          </button>
          <button
            onClick={() => setWorkspace('access')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            {isFa ? 'کنترل دسترسی دستگاه‌ها' : 'Device Access Control'}
          </button>
          <button
            onClick={() => setWorkspace('node')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            {isFa ? 'نود استخر' : 'Pool Nodes'}
          </button>
          <button
            onClick={() => setWorkspace('cli')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            {isFa ? 'مستندات و CLI' : 'CLI & Docs'}
          </button>
        </div>
      </footer>
    </div>
  );
}
