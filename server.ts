import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

export type DeviceAuthStatus = 'approved' | 'pending' | 'rejected' | 'blocked' | 'revoked';

export interface ManagedDeviceRecord {
  identity: string; // Exact Wallet.Worker.Device
  wallet: string;
  worker: string;
  deviceId: string;
  authStatus: DeviceAuthStatus;
  connectionStatus: 'connected' | 'disconnected';
  activeConnections: number;
  activeSessionIds: string[];
  maxConnections: number;
  hashrate: number;
  unit: 'T' | 'G' | 'M';
  ip: string;
  connectedAt: string | null;
  lastAttemptAt: string;
  lastDisconnectReason: string | null;
}

export interface CustomerQuotaRecord {
  wallet: string;
  maxSimultaneousConnections: number;
  paymentTier: string;
  paymentVerified: boolean;
  updatedAt: string;
}

export interface AccessAuditLogEntry {
  id: string;
  timestamp: string;
  type: 'connection_allowed' | 'connection_denied' | 'admin_action' | 'immediate_disconnect';
  identity: string;
  action: string;
  detailsEn: string;
  detailsFa: string;
  ip: string;
}

export interface AccessControlStore {
  version: '1.0.0';
  accessControlEnabled: boolean;
  devices: Record<string, ManagedDeviceRecord>;
  customers: Record<string, CustomerQuotaRecord>;
  auditLogs: AccessAuditLogEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'access-control.json');

function nowTimestamp(): string {
  const d = new Date();
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function createInitialStore(): AccessControlStore {
  const ts = nowTimestamp();
  return {
    version: '1.0.0',
    accessControlEnabled: true,
    devices: {
      'wallet1.worker1.device101': {
        identity: 'wallet1.worker1.device101',
        wallet: 'wallet1',
        worker: 'worker1',
        deviceId: 'device101',
        authStatus: 'approved',
        connectionStatus: 'connected',
        activeConnections: 1,
        activeSessionIds: ['sess-101-a'],
        maxConnections: 1,
        hashrate: 235.19,
        unit: 'T',
        ip: '223.104.238.124',
        connectedAt: '2026-10-28 09:15:04',
        lastAttemptAt: '2026-10-28 12:20:10',
        lastDisconnectReason: null,
      },
      'wallet1.worker2.device102': {
        identity: 'wallet1.worker2.device102',
        wallet: 'wallet1',
        worker: 'worker2',
        deviceId: 'device102',
        authStatus: 'approved',
        connectionStatus: 'connected',
        activeConnections: 1,
        activeSessionIds: ['sess-102-a'],
        maxConnections: 2,
        hashrate: 198.45,
        unit: 'T',
        ip: '223.104.238.125',
        connectedAt: '2026-10-28 09:42:19',
        lastAttemptAt: '2026-10-28 12:21:00',
        lastDisconnectReason: null,
      },
      'farm_north_btc01.rack04.whatsminer19': {
        identity: 'farm_north_btc01.rack04.whatsminer19',
        wallet: 'farm_north_btc01',
        worker: 'rack04',
        deviceId: 'whatsminer19',
        authStatus: 'approved',
        connectionStatus: 'connected',
        activeConnections: 1,
        activeSessionIds: ['sess-wm19-a'],
        maxConnections: 1,
        hashrate: 156.8,
        unit: 'T',
        ip: '117.136.40.91',
        connectedAt: '2026-10-28 08:00:12',
        lastAttemptAt: '2026-10-28 12:18:40',
        lastDisconnectReason: null,
      },
      'wallet2.rig08.device204': {
        identity: 'wallet2.rig08.device204',
        wallet: 'wallet2',
        worker: 'rig08',
        deviceId: 'device204',
        authStatus: 'pending',
        connectionStatus: 'disconnected',
        activeConnections: 0,
        activeSessionIds: [],
        maxConnections: 1,
        hashrate: 0,
        unit: 'T',
        ip: '185.220.101.72',
        connectedAt: null,
        lastAttemptAt: '2026-10-28 12:22:15',
        lastDisconnectReason: 'Awaiting Admin Approval (Strict Mode)',
      },
      'wallet3.hallB.asic309': {
        identity: 'wallet3.hallB.asic309',
        wallet: 'wallet3',
        worker: 'hallB',
        deviceId: 'asic309',
        authStatus: 'pending',
        connectionStatus: 'disconnected',
        activeConnections: 0,
        activeSessionIds: [],
        maxConnections: 1,
        hashrate: 0,
        unit: 'T',
        ip: '91.108.56.140',
        connectedAt: null,
        lastAttemptAt: '2026-10-28 12:23:42',
        lastDisconnectReason: 'Awaiting Admin Approval (Strict Mode)',
      },
      'rogue_wallet.bot01.device999': {
        identity: 'rogue_wallet.bot01.device999',
        wallet: 'rogue_wallet',
        worker: 'bot01',
        deviceId: 'device999',
        authStatus: 'blocked',
        connectionStatus: 'disconnected',
        activeConnections: 0,
        activeSessionIds: [],
        maxConnections: 1,
        hashrate: 0,
        unit: 'T',
        ip: '45.155.205.109',
        connectedAt: null,
        lastAttemptAt: '2026-10-28 12:19:50',
        lastDisconnectReason: 'Blocked by Admin — Unauthorized Reconnect Attempt',
      },
    },
    customers: {
      wallet1: {
        wallet: 'wallet1',
        maxSimultaneousConnections: 3,
        paymentTier: 'Pro Plan (Up to 3 Connections)',
        paymentVerified: true,
        updatedAt: ts,
      },
      farm_north_btc01: {
        wallet: 'farm_north_btc01',
        maxSimultaneousConnections: 10,
        paymentTier: 'Enterprise Farm Plan (10 Connections)',
        paymentVerified: true,
        updatedAt: ts,
      },
      wallet2: {
        wallet: 'wallet2',
        maxSimultaneousConnections: 1,
        paymentTier: 'Standard Plan (1 Connection)',
        paymentVerified: true,
        updatedAt: ts,
      },
      wallet3: {
        wallet: 'wallet3',
        maxSimultaneousConnections: 2,
        paymentTier: 'Dual Miner Plan (2 Connections)',
        paymentVerified: true,
        updatedAt: ts,
      },
    },
    auditLogs: [
      {
        id: 'log-1',
        timestamp: '2026-10-28 12:23:42',
        type: 'connection_denied',
        identity: 'wallet3.hallB.asic309',
        action: 'QUEUE_PENDING',
        detailsEn: 'Unrecognized Wallet.Worker.Device denied under strict access control and placed in pending queue.',
        detailsFa: 'اتصال دستگاه ناشناس wallet3.hallB.asic309 در حالت کنترل دسترسی رد شد و در صف انتظار تایید قرار گرفت.',
        ip: '91.108.56.140',
      },
      {
        id: 'log-2',
        timestamp: '2026-10-28 12:21:00',
        type: 'connection_allowed',
        identity: 'wallet1.worker2.device102',
        action: 'CONNECT_OK',
        detailsEn: 'Authorized device connected (1/2 device sessions, 2/3 wallet1 customer quota).',
        detailsFa: 'اتصال دستگاه مجاز برقرار شد (۱ از ۲ ظرفیت دستگاه، ۲ از ۳ سهمیه مشتری wallet1).',
        ip: '223.104.238.125',
      },
      {
        id: 'log-3',
        timestamp: '2026-10-28 12:19:50',
        type: 'connection_denied',
        identity: 'rogue_wallet.bot01.device999',
        action: 'BLOCKED_REJECT',
        detailsEn: 'Blocked device attempted reconnect bypass — immediately rejected by Stratum guard.',
        detailsFa: 'تلاش مجدد دستگاه مسدودشده برای دور زدن محدودیت فوراً توسط گارد سرور رد شد.',
        ip: '45.155.205.109',
      },
    ],
  };
}

function loadStore(): AccessControlStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as AccessControlStore;
      parsed.version = '1.0.0';
      return parsed;
    }
  } catch (err) {
    console.error('[BitLite v1.0.0] Failed to read access-control store, initializing fresh:', err);
  }
  const initial = createInitialStore();
  saveStore(initial);
  return initial;
}

function saveStore(store: AccessControlStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    store.version = '1.0.0';
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[BitLite v1.0.0] Failed to persist access-control store:', err);
  }
}

function parseDeviceIdentity(rawIdentity: string): {
  valid: boolean;
  identity: string;
  wallet: string;
  worker: string;
  deviceId: string;
} {
  const trimmed = (rawIdentity || '').trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3 || parts.some((p) => !p || !/^[A-Za-z0-9_-]+$/.test(p))) {
    return { valid: false, identity: trimmed, wallet: '', worker: '', deviceId: '' };
  }
  const [wallet, worker, deviceId] = parts;
  return {
    valid: true,
    identity: `${wallet}.${worker}.${deviceId}`,
    wallet,
    worker,
    deviceId,
  };
}

function getWalletActiveConnections(store: AccessControlStore, wallet: string): number {
  return Object.values(store.devices)
    .filter((d) => d.wallet === wallet && d.connectionStatus === 'connected')
    .reduce((sum, d) => sum + d.activeConnections, 0);
}

function appendLog(
  store: AccessControlStore,
  entry: Omit<AccessAuditLogEntry, 'id' | 'timestamp'>
): void {
  const newEntry: AccessAuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowTimestamp(),
  };
  store.auditLogs.unshift(newEntry);
  if (store.auditLogs.length > 150) {
    store.auditLogs = store.auditLogs.slice(0, 150);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  let store = loadStore();

  // GET full access-control state
  app.get('/api/access-control/state', (_req, res) => {
    res.json(store);
  });

  // POST toggle global access control
  app.post('/api/access-control/toggle', (req, res) => {
    const enabled = Boolean(req.body?.enabled);
    store.accessControlEnabled = enabled;

    // When strict access control is enabled, immediately disconnect any non-approved devices that were connected in public mode
    let disconnectedCount = 0;
    if (enabled) {
      Object.values(store.devices).forEach((dev) => {
        if (dev.authStatus !== 'approved' && dev.activeConnections > 0) {
          disconnectedCount += dev.activeConnections;
          dev.activeConnections = 0;
          dev.activeSessionIds = [];
          dev.connectionStatus = 'disconnected';
          dev.hashrate = 0;
          dev.lastDisconnectReason = 'Strict Access Control Enabled — Unapproved Device Disconnected';
        }
      });
    }

    appendLog(store, {
      type: 'admin_action',
      identity: 'GLOBAL_POLICY',
      action: enabled ? 'ENABLE_ACCESS_CONTROL' : 'DISABLE_ACCESS_CONTROL',
      detailsEn: enabled
        ? `Admin enabled strict device-level access control (${disconnectedCount} unapproved active sessions disconnected).`
        : 'Admin disabled strict access control — Pool is now in Public Mode (blocked/revoked devices remain denied).',
      detailsFa: enabled
        ? `کنترل دسترسی سطح دستگاه فعال شد (${disconnectedCount} نشست غیرمجاز فوراً قطع گردید).`
        : 'کنترل دسترسی غیرفعال شد — استخر در حالت عمومی قرار گرفت (دستگاه‌های مسدود همچنان رد می‌شوند).',
      ip: '127.0.0.1',
    });

    saveStore(store);
    res.json({ ok: true, store });
  });

  // POST simulate or enforce incoming miner connection (Wallet.Worker.Device)
  app.post('/api/access-control/connect', (req, res) => {
    const rawIdentity = String(req.body?.identity || '');
    const ip = String(req.body?.ip || '192.168.10.55');
    const requestedHashrate = Number(req.body?.hashrate) || 215.4;

    const parsed = parseDeviceIdentity(rawIdentity);
    if (!parsed.valid) {
      appendLog(store, {
        type: 'connection_denied',
        identity: rawIdentity || 'INVALID',
        action: 'INVALID_IDENTITY_FORMAT',
        detailsEn: `Connection rejected: Identity "${rawIdentity}" must follow exact Wallet.Worker.Device format.`,
        detailsFa: `اتصال رد شد: شناسه "${rawIdentity}" باید دقیقاً با فرمت Wallet.Worker.Device باشد.`,
        ip,
      });
      saveStore(store);
      return res.status(400).json({
        allowed: false,
        reasonEn: 'Invalid format. Must be exact Wallet.Worker.Device (e.g. wallet1.worker1.device101).',
        reasonFa: 'فرمت نامعتبر است. شناسه باید دقیقاً به صورت Wallet.Worker.Device باشد.',
        store,
      });
    }

    const { identity, wallet, worker, deviceId } = parsed;
    const existing = store.devices[identity];

    // Ensure customer quota record exists (default 1 connection if new customer)
    if (!store.customers[wallet]) {
      store.customers[wallet] = {
        wallet,
        maxSimultaneousConnections: 1,
        paymentTier: 'Standard Default (1 Connection)',
        paymentVerified: false,
        updatedAt: nowTimestamp(),
      };
    }
    const customerQuota = store.customers[wallet];

    // 1. Blocked or Revoked devices are ALWAYS denied in both Public and Strict mode
    if (existing && (existing.authStatus === 'blocked' || existing.authStatus === 'revoked')) {
      existing.lastAttemptAt = nowTimestamp();
      existing.activeConnections = 0;
      existing.activeSessionIds = [];
      existing.connectionStatus = 'disconnected';
      existing.hashrate = 0;

      appendLog(store, {
        type: 'connection_denied',
        identity,
        action: existing.authStatus === 'blocked' ? 'DENY_BLOCKED' : 'DENY_REVOKED',
        detailsEn: `Connection denied: Device is ${existing.authStatus.toUpperCase()} — reconnect bypass prevented.`,
        detailsFa: `اتصال رد شد: دستگاه در وضعیت ${existing.authStatus === 'blocked' ? 'مسدود (Blocked)' : 'لغو مجوز (Revoked)'} قرار دارد.`,
        ip,
      });
      saveStore(store);
      return res.status(403).json({
        allowed: false,
        reasonEn: `Connection denied: Device ${identity} is ${existing.authStatus}.`,
        reasonFa: `اتصال رد شد: دسترسی دستگاه ${identity} مسدود یا لغو شده است.`,
        store,
      });
    }

    // 2. If Strict Access Control is ENABLED, check explicit approval
    if (store.accessControlEnabled) {
      if (!existing) {
        // Queue new pending request
        store.devices[identity] = {
          identity,
          wallet,
          worker,
          deviceId,
          authStatus: 'pending',
          connectionStatus: 'disconnected',
          activeConnections: 0,
          activeSessionIds: [],
          maxConnections: 1,
          hashrate: 0,
          unit: 'T',
          ip,
          connectedAt: null,
          lastAttemptAt: nowTimestamp(),
          lastDisconnectReason: 'Queued for Admin Approval',
        };
        appendLog(store, {
          type: 'connection_denied',
          identity,
          action: 'QUEUED_FOR_APPROVAL',
          detailsEn: `Unrecognized device ${identity} denied by default and added to Pending Requests queue.`,
          detailsFa: `دستگاه جدید ${identity} به صورت پیش‌فرض رد شد و در صف درخواست‌های در انتظار تایید قرار گرفت.`,
          ip,
        });
        saveStore(store);
        return res.status(403).json({
          allowed: false,
          queued: true,
          reasonEn: `Device ${identity} is not authorized. Added to pending approval queue.`,
          reasonFa: `دستگاه ${identity} مجوز ندارد و به صف انتظار تایید مدیر اضافه شد.`,
          store,
        });
      }

      if (existing.authStatus !== 'approved') {
        existing.lastAttemptAt = nowTimestamp();
        existing.ip = ip;
        appendLog(store, {
          type: 'connection_denied',
          identity,
          action: 'UNAPPROVED_RETRY_BLOCKED',
          detailsEn: `Reconnect attempt from ${existing.authStatus} device ${identity} denied.`,
          detailsFa: `تلاش مجدد اتصال از دستگاه تاییدنشده (${existing.authStatus}) رد شد.`,
          ip,
        });
        saveStore(store);
        return res.status(403).json({
          allowed: false,
          reasonEn: `Device ${identity} status is "${existing.authStatus}". Admin approval required.`,
          reasonFa: `وضعیت دستگاه "${existing.authStatus}" است و نیاز به تایید مدیر دارد.`,
          store,
        });
      }
    }

    // 3. Device is either approved (Strict Mode) or connecting under Public Mode
    const targetDevice: ManagedDeviceRecord =
      existing ||
      (store.devices[identity] = {
        identity,
        wallet,
        worker,
        deviceId,
        authStatus: 'approved',
        connectionStatus: 'disconnected',
        activeConnections: 0,
        activeSessionIds: [],
        maxConnections: 1,
        hashrate: 0,
        unit: 'T',
        ip,
        connectedAt: null,
        lastAttemptAt: nowTimestamp(),
        lastDisconnectReason: null,
      });

    targetDevice.lastAttemptAt = nowTimestamp();
    targetDevice.ip = ip;

    // 4. Enforce per-device simultaneous connection limit
    if (targetDevice.activeConnections >= targetDevice.maxConnections) {
      appendLog(store, {
        type: 'connection_denied',
        identity,
        action: 'DEVICE_LIMIT_EXCEEDED',
        detailsEn: `Duplicate connection denied for ${identity}: active (${targetDevice.activeConnections}) reached device limit (${targetDevice.maxConnections}).`,
        detailsFa: `اتصال تکراری برای ${identity} رد شد: تعداد نشست فعال (${targetDevice.activeConnections}) به سقف مجاز دستگاه (${targetDevice.maxConnections}) رسیده است.`,
        ip,
      });
      saveStore(store);
      return res.status(429).json({
        allowed: false,
        reasonEn: `Simultaneous connection limit reached for device ${identity} (${targetDevice.activeConnections}/${targetDevice.maxConnections}).`,
        reasonFa: `سقف اتصال همزمان برای دستگاه ${identity} پر شده است (${targetDevice.activeConnections}/${targetDevice.maxConnections}).`,
        store,
      });
    }

    // 5. Enforce per-customer (wallet) simultaneous connection limit based on payment
    const currentWalletConns = getWalletActiveConnections(store, wallet);
    if (currentWalletConns >= customerQuota.maxSimultaneousConnections) {
      appendLog(store, {
        type: 'connection_denied',
        identity,
        action: 'CUSTOMER_QUOTA_EXCEEDED',
        detailsEn: `Customer quota reached for wallet "${wallet}": ${currentWalletConns}/${customerQuota.maxSimultaneousConnections} simultaneous connections active.`,
        detailsFa: `سقف مجاز اتصال همزمان مشتری "${wallet}" پر شده است (${currentWalletConns} از ${customerQuota.maxSimultaneousConnections} اتصال فعال).`,
        ip,
      });
      saveStore(store);
      return res.status(429).json({
        allowed: false,
        reasonEn: `Customer "${wallet}" simultaneous connection limit (${customerQuota.maxSimultaneousConnections}) reached. Upgrade payment plan to add more connections.`,
        reasonFa: `سهمیه اتصال همزمان کیف‌پول "${wallet}" (${customerQuota.maxSimultaneousConnections} اتصال) تکمیل شده است.`,
        store,
      });
    }

    // 6. Authorize & establish connection session
    const sessionId = `sess-${Date.now().toString(36)}`;
    targetDevice.activeConnections += 1;
    targetDevice.activeSessionIds.push(sessionId);
    targetDevice.connectionStatus = 'connected';
    targetDevice.connectedAt = nowTimestamp();
    targetDevice.hashrate = Number((targetDevice.hashrate + requestedHashrate).toFixed(2));
    targetDevice.lastDisconnectReason = null;

    appendLog(store, {
      type: 'connection_allowed',
      identity,
      action: 'SESSION_ESTABLISHED',
      detailsEn: `Connection authorized for ${identity} (Device: ${targetDevice.activeConnections}/${targetDevice.maxConnections}, Wallet ${wallet}: ${currentWalletConns + 1}/${customerQuota.maxSimultaneousConnections}).`,
      detailsFa: `اتصال ${identity} برقرار شد (دستگاه: ${targetDevice.activeConnections}/${targetDevice.maxConnections}، کیف‌پول ${wallet}: ${currentWalletConns + 1}/${customerQuota.maxSimultaneousConnections}).`,
      ip,
    });

    saveStore(store);
    return res.json({
      allowed: true,
      sessionId,
      store,
    });
  });

  // POST admin action on a device: approve | enable | disable | reject | block | unblock | revoke | disconnect | set_limit
  app.post('/api/access-control/device-action', (req, res) => {
    const rawIdentity = String(req.body?.identity || '');
    const action = String(req.body?.action || '');
    const maxConnectionsInput = req.body?.maxConnections;
    const reqIp = String(req.body?.ip || '0.0.0.0');
    const reqHashrate = Number(req.body?.hashrate ?? 0);
    const reqUnit = (req.body?.unit as 'T' | 'G' | 'M') || 'T';

    let identity = rawIdentity.trim();
    let dev = store.devices[identity];

    if (!dev) {
      const parsed = parseDeviceIdentity(identity);
      if (!parsed.valid) {
        return res.status(404).json({ error: 'Device not found and invalid identity format' });
      }
      identity = parsed.identity;
      dev = store.devices[identity] = {
        identity: parsed.identity,
        wallet: parsed.wallet,
        worker: parsed.worker,
        deviceId: parsed.deviceId,
        authStatus: 'approved',
        connectionStatus: reqHashrate > 0 ? 'connected' : 'disconnected',
        activeConnections: reqHashrate > 0 ? 1 : 0,
        activeSessionIds: reqHashrate > 0 ? [`sess-${Date.now().toString(36)}`] : [],
        maxConnections: 1,
        hashrate: reqHashrate > 0 ? reqHashrate : 0,
        unit: reqUnit,
        ip: reqIp,
        connectedAt: reqHashrate > 0 ? nowTimestamp() : null,
        lastAttemptAt: nowTimestamp(),
        lastDisconnectReason: null,
      };
    }

    if (action === 'approve' || action === 'enable') {
      dev.authStatus = 'approved';
      if (maxConnectionsInput !== undefined) {
        dev.maxConnections = Math.max(1, Math.min(100, Number(maxConnectionsInput) || 1));
      } else if (!dev.maxConnections || dev.maxConnections < 1) {
        dev.maxConnections = 1;
      }
      if (action === 'enable' || reqHashrate > 0) {
        dev.connectionStatus = 'connected';
        dev.activeConnections = Math.max(1, dev.activeConnections || 1);
        if (dev.activeSessionIds.length === 0) {
          dev.activeSessionIds = [`sess-${Date.now().toString(36)}`];
        }
        dev.connectedAt = dev.connectedAt || nowTimestamp();
        if (reqHashrate > 0) {
          dev.hashrate = Number(reqHashrate.toFixed(2));
        }
      }
      dev.lastDisconnectReason = null;

      // Ensure customer exists
      if (!store.customers[dev.wallet]) {
        store.customers[dev.wallet] = {
          wallet: dev.wallet,
          maxSimultaneousConnections: Math.max(1, dev.maxConnections),
          paymentTier: 'Approved Standard Plan',
          paymentVerified: true,
          updatedAt: nowTimestamp(),
        };
      }

      appendLog(store, {
        type: 'admin_action',
        identity,
        action: action === 'enable' ? 'ENABLE_DEVICE' : 'APPROVE_DEVICE',
        detailsEn: `Admin enabled/approved ${identity} with max ${dev.maxConnections} simultaneous connection(s).`,
        detailsFa: `مدیر دستگاه ${identity} را فعال و مجاز کرد (سقف ${dev.maxConnections} اتصال همزمان).`,
        ip: dev.ip,
      });
    } else if (action === 'disable') {
      const hadActive = dev.activeConnections;
      dev.authStatus = 'revoked';
      dev.activeConnections = 0;
      dev.activeSessionIds = [];
      dev.connectionStatus = 'disconnected';
      dev.hashrate = 0;
      dev.lastDisconnectReason = 'Disabled by Admin — Immediate Disconnect';

      appendLog(store, {
        type: 'immediate_disconnect',
        identity,
        action: 'DISABLE_DEVICE',
        detailsEn: `Admin disabled ${identity}. Immediately disconnected ${hadActive} active session(s).`,
        detailsFa: `دستگاه ${identity} توسط مدیر غیرفعال شد و ${hadActive} نشست فعال آن فوراً قطع گردید.`,
        ip: dev.ip,
      });
    } else if (action === 'reject') {
      dev.authStatus = 'rejected';
      dev.activeConnections = 0;
      dev.activeSessionIds = [];
      dev.connectionStatus = 'disconnected';
      dev.hashrate = 0;
      dev.lastDisconnectReason = 'Rejected by Admin';

      appendLog(store, {
        type: 'admin_action',
        identity,
        action: 'REJECT_REQUEST',
        detailsEn: `Admin rejected connection request for ${identity}.`,
        detailsFa: `درخواست اتصال دستگاه ${identity} توسط مدیر رد شد.`,
        ip: dev.ip,
      });
    } else if (action === 'block') {
      const hadActive = dev.activeConnections;
      dev.authStatus = 'blocked';
      dev.activeConnections = 0;
      dev.activeSessionIds = [];
      dev.connectionStatus = 'disconnected';
      dev.hashrate = 0;
      dev.lastDisconnectReason = 'Blocked by Admin — Immediate Disconnect';

      appendLog(store, {
        type: 'immediate_disconnect',
        identity,
        action: 'BLOCK_AND_DISCONNECT',
        detailsEn: `Admin blocked ${identity}. Immediately terminated ${hadActive} active connection(s) and barred future access.`,
        detailsFa: `دستگاه ${identity} توسط مدیر مسدود شد. ${hadActive} نشست فعال فوراً قطع گردید و دسترسی آینده مسدود شد.`,
        ip: dev.ip,
      });
    } else if (action === 'unblock') {
      dev.authStatus = 'pending';
      dev.lastDisconnectReason = 'Unblocked — Pending Approval';

      appendLog(store, {
        type: 'admin_action',
        identity,
        action: 'UNBLOCK_DEVICE',
        detailsEn: `Admin unblocked ${identity} and moved it to pending review.`,
        detailsFa: `رفع مسدودیت دستگاه ${identity} انجام شد و به وضعیت در انتظار تایید منتقل گردید.`,
        ip: dev.ip,
      });
    } else if (action === 'revoke') {
      const hadActive = dev.activeConnections;
      dev.authStatus = 'revoked';
      dev.activeConnections = 0;
      dev.activeSessionIds = [];
      dev.connectionStatus = 'disconnected';
      dev.hashrate = 0;
      dev.lastDisconnectReason = 'Authorization Revoked — Immediate Disconnect';

      appendLog(store, {
        type: 'immediate_disconnect',
        identity,
        action: 'REVOKE_AND_DISCONNECT',
        detailsEn: `Admin revoked permissions for ${identity}. Immediately disconnected ${hadActive} active session(s).`,
        detailsFa: `مجوز دستگاه ${identity} لغو شد و ${hadActive} اتصال فعال آن فوراً قطع گردید.`,
        ip: dev.ip,
      });
    } else if (action === 'disconnect') {
      const hadActive = dev.activeConnections;
      dev.activeConnections = 0;
      dev.activeSessionIds = [];
      dev.connectionStatus = 'disconnected';
      dev.hashrate = 0;
      dev.lastDisconnectReason = 'Immediate Disconnect by Admin';

      appendLog(store, {
        type: 'immediate_disconnect',
        identity,
        action: 'FORCE_DISCONNECT',
        detailsEn: `Admin triggered immediate disconnect on ${identity} (${hadActive} session(s) closed).`,
        detailsFa: `قطع اتصال آنی برای دستگاه ${identity} اجرا شد (${hadActive} نشست بسته شد).`,
        ip: dev.ip,
      });
    } else if (action === 'set_limit') {
      const newLimit = Math.max(1, Math.min(100, Number(maxConnectionsInput) || 1));
      dev.maxConnections = newLimit;
      if (dev.activeConnections > newLimit) {
        const dropped = dev.activeConnections - newLimit;
        dev.activeConnections = newLimit;
        dev.activeSessionIds = dev.activeSessionIds.slice(0, newLimit);
        appendLog(store, {
          type: 'immediate_disconnect',
          identity,
          action: 'LIMIT_REDUCED_DISCONNECT',
          detailsEn: `Device limit for ${identity} set to ${newLimit}; immediately dropped ${dropped} excess connection(s).`,
          detailsFa: `سقف اتصال دستگاه ${identity} به ${newLimit} کاهش یافت و ${dropped} نشست مازاد فوراً قطع شد.`,
          ip: dev.ip,
        });
      } else {
        appendLog(store, {
          type: 'admin_action',
          identity,
          action: 'UPDATE_DEVICE_LIMIT',
          detailsEn: `Updated simultaneous connection limit for ${identity} to ${newLimit}.`,
          detailsFa: `سقف اتصال همزمان دستگاه ${identity} به ${newLimit} تغییر یافت.`,
          ip: dev.ip,
        });
      }
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }

    saveStore(store);
    return res.json({ ok: true, store });
  });

  // POST manually pre-authorize a new Wallet.Worker.Device
  app.post('/api/access-control/authorize-new', (req, res) => {
    const rawIdentity = String(req.body?.identity || '');
    const maxConnections = Math.max(1, Math.min(100, Number(req.body?.maxConnections) || 1));
    const customerMax = Math.max(
      maxConnections,
      Math.min(500, Number(req.body?.customerMaxConnections) || maxConnections)
    );
    const paymentTier = String(req.body?.paymentTier || `Paid Plan (${customerMax} Connections)`);

    const parsed = parseDeviceIdentity(rawIdentity);
    if (!parsed.valid) {
      return res.status(400).json({
        errorEn: 'Identity must match exact Wallet.Worker.Device format (e.g. wallet1.worker1.device101).',
        errorFa: 'شناسه دستگاه باید دقیقاً با فرمت Wallet.Worker.Device باشد (مثال: wallet1.worker1.device101).',
      });
    }

    const { identity, wallet, worker, deviceId } = parsed;
    store.devices[identity] = {
      identity,
      wallet,
      worker,
      deviceId,
      authStatus: 'approved',
      connectionStatus: store.devices[identity]?.connectionStatus || 'disconnected',
      activeConnections: store.devices[identity]?.activeConnections || 0,
      activeSessionIds: store.devices[identity]?.activeSessionIds || [],
      maxConnections,
      hashrate: store.devices[identity]?.hashrate || 0,
      unit: 'T',
      ip: store.devices[identity]?.ip || '0.0.0.0',
      connectedAt: store.devices[identity]?.connectedAt || null,
      lastAttemptAt: nowTimestamp(),
      lastDisconnectReason: null,
    };

    store.customers[wallet] = {
      wallet,
      maxSimultaneousConnections: customerMax,
      paymentTier,
      paymentVerified: true,
      updatedAt: nowTimestamp(),
    };

    appendLog(store, {
      type: 'admin_action',
      identity,
      action: 'PRE_AUTHORIZE_DEVICE',
      detailsEn: `Admin authorized ${identity} (device limit: ${maxConnections}, customer "${wallet}" limit: ${customerMax}).`,
      detailsFa: `دستگاه ${identity} توسط مدیر مجاز شد (سقف دستگاه: ${maxConnections}، سقف مشتری "${wallet}": ${customerMax}).`,
      ip: '127.0.0.1',
    });

    saveStore(store);
    return res.json({ ok: true, store });
  });

  // POST update customer/wallet simultaneous connection quota based on payment
  app.post('/api/access-control/customer-limit', (req, res) => {
    const wallet = String(req.body?.wallet || '').trim();
    const maxSimultaneousConnections = Math.max(
      1,
      Math.min(1000, Number(req.body?.maxSimultaneousConnections) || 1)
    );
    const paymentTier = String(
      req.body?.paymentTier || `Paid Tier (${maxSimultaneousConnections} Conns)`
    );
    const paymentVerified = Boolean(req.body?.paymentVerified ?? true);

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet is required' });
    }

    store.customers[wallet] = {
      wallet,
      maxSimultaneousConnections,
      paymentTier,
      paymentVerified,
      updatedAt: nowTimestamp(),
    };

    // Enforce immediately if current wallet active connections exceed new quota
    let walletActive = getWalletActiveConnections(store, wallet);
    if (walletActive > maxSimultaneousConnections) {
      for (const dev of Object.values(store.devices)) {
        if (dev.wallet === wallet && dev.activeConnections > 0 && walletActive > maxSimultaneousConnections) {
          const drop = Math.min(dev.activeConnections, walletActive - maxSimultaneousConnections);
          dev.activeConnections -= drop;
          dev.activeSessionIds = dev.activeSessionIds.slice(0, dev.activeConnections);
          if (dev.activeConnections === 0) {
            dev.connectionStatus = 'disconnected';
            dev.hashrate = 0;
            dev.lastDisconnectReason = 'Customer Quota Reduced — Excess Session Disconnected';
          }
          walletActive -= drop;
        }
      }
    }

    appendLog(store, {
      type: 'admin_action',
      identity: `${wallet}.*.*`,
      action: 'UPDATE_CUSTOMER_QUOTA',
      detailsEn: `Updated customer "${wallet}" quota to ${maxSimultaneousConnections} simultaneous connection(s) (${paymentTier}).`,
      detailsFa: `سهمیه اتصال همزمان مشتری "${wallet}" بر اساس پرداخت به ${maxSimultaneousConnections} اتصال تغییر یافت (${paymentTier}).`,
      ip: '127.0.0.1',
    });

    saveStore(store);
    return res.json({ ok: true, store });
  });

  // Mount Vite middleware in development or static dist in production
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'));
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[BitLite System v1.0.0] Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
