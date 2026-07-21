import React, { ReactNode } from 'react';
import { useAuth } from '../auth';
import { hasPermission, isServiceEnabledForUser, type ServiceItem } from '../services-catalog';

type ComponentProps = {
  /** Single RBAC key — one UI component, one permission. */
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
};

/** Renders children only when the user has this one component permission. */
export function PermissionGate({ permission, children, fallback = null }: ComponentProps) {
  const allowed = useCanAccess(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}

type ServiceTileProps = {
  /** Service tile — visible when user has ANY child component permission (no tile-level key). */
  service: ServiceItem;
  children: ReactNode;
  fallback?: ReactNode;
};

/** Renders children when the user can access at least one component inside this service. */
export function ServicePermissionGate({ service, children, fallback = null }: ServiceTileProps) {
  const allowed = useCanAccessService(service);
  return allowed ? <>{children}</> : <>{fallback}</>;
}

/** Hook — single component permission. */
export function useCanAccess(permission?: string): boolean {
  const { user } = useAuth();
  if (!user || !permission) return false;
  return hasPermission(user.permissions ?? [], permission);
}

/** Hook — service tile (any child component permission). */
export function useCanAccessService(service?: ServiceItem): boolean {
  const { user } = useAuth();
  if (!user || !service) return false;
  return isServiceEnabledForUser(service, user.role, user.department, user.permissions ?? []);
}
