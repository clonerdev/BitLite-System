export type Lang = 'fa' | 'en';

export type WorkspaceMode = 'proxy' | 'access' | 'node' | 'algorithms' | 'cli';

export type MultiPoolStrategy = 'load_balance' | 'simultaneous_multi' | 'priority_failover';

export type SettingsCategory =
  | '2fa'
  | 'credentials'
  | 'safe_url'
  | 'https'
  | 'session_ttl'
  | 'web_port'
  | 'tls_cert'
  | 'ip_blacklist'
  | 'wallet_blacklist'
  | 'wallet_whitelist'
  | 'offline_webhook'
  | 'kenc_key'
  | 'quick_pools';

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

export interface PoolCatalogEntry {
  id: string;
  name: string;
  nameFa: string;
  coin: string;
  algorithm: string;
  host: string;
  tcpPort: number;
  sslPort?: number;
  regionEn: string;
  regionFa: string;
  isBuiltIn: boolean;
}

export interface UpstreamPoolTarget {
  id: string;
  poolName: string;
  host: string;
  port: number;
  protocol: 'TCP' | 'SSL';
  weightPercent: number;
  workerSubaccount?: string;
  status: 'connected' | 'standby' | 'unreachable';
  latencyMs: number;
  activeHashrate: number;
  acceptedShares: number;
  enabled: boolean;
}

export interface SharePoint {
  time: string;
  validHashrate: number;
  invalidHashrate: number;
  feeHashrate: number;
  validShares: number;
  invalidShares: number;
  feeShares: number;
}

export interface MinerWorker {
  id: string;
  deviceName: string;
  walletAddress: string;
  status: 'online' | 'offline';
  adminState?: 'enabled' | 'disabled' | 'blocked';
  currentHashrate: number;
  avg15mHashrate: number;
  avg4hHashrate: number;
  avg24hHashrate: number;
  currentFeeHashrate: number;
  avg15mFeeHashrate: number;
  avg4hFeeHashrate: number;
  avg24hFeeHashrate: number;
  localHashrate: number;
  validShares: number;
  invalidShares: number;
  feeShares: number;
  firmware: string;
  difficulty: string;
  disconnectCount: number;
  feeRatePercent: number;
  algorithm: string;
  latencyMs: number;
  ip: string;
  connections: number;
  connectedAt: string;
  lastShareAt: string;
  lastJobAt: string;
  logs: string[];
}

export interface ProxyPort {
  id: string;
  coin: string;
  labelEn: string;
  labelFa: string;
  algorithm: string;
  unit: 'T' | 'P' | 'G' | 'M';
  icon: string;
  listenPort: number;
  protocol: 'TCP' | 'SSL' | 'BLC';
  targetPool: string;
  targetPort: number;
  backupPool: string;
  multiPoolStrategy: MultiPoolStrategy;
  upstreamPools: UpstreamPoolTarget[];
  feeRatePercent: number;
  feeWallet: string;
  feeWorkerName: string;
  status: 'running' | 'stopped';
  onlineDevices: number;
  offlineDevices: number;
  currentHashrate: number;
  avg15mHashrate: number;
  avg4hHashrate: number;
  avg24hHashrate: number;
  feeHashrate15m: number;
  invalidHashrate15m: number;
  series: SharePoint[];
  workers: MinerWorker[];
}

export interface PoolNodeItem {
  id: string;
  coin: string;
  mergedCoinEn?: string;
  mergedCoinFa?: string;
  algorithm: string;
  icon: string;
  nodePort: number;
  stratumUrl: string;
  dailyYieldPerUnit: string;
  coinPriceUsd: string;
  poolHashrate: string;
  networkHashrate: string;
  blockHeight: number;
  lastBlockFoundEn: string;
  lastBlockFoundFa: string;
  totalRevenueBtc: number;
  estimatedUsd: number;
  paidAmount: number;
  unpaidAmount: number;
  connectedMiners: number;
  feePercent: number;
  status: 'synced' | 'syncing';
}

export interface AlgorithmSupport {
  algorithm: string;
  coins: string[];
  recommendedProtocol: string;
  blcEncrypted: boolean;
}
