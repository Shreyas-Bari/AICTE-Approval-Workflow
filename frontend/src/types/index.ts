export interface ApiHealthStatus {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
  version: string;
}

export type UserRole =
  | 'INSTITUTION'
  | 'SCRUTINY_OFFICIAL'
  | 'EVC_OFFICIAL'
  | 'REGIONAL_OFFICER'
  | 'ADMIN';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export * from './auth';
export * from './institution';
export * from './application';
