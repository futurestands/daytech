import { Request, Response, NextFunction } from 'express';
import {
  isFirebaseFeatureEnabledServer,
  isServerlessRuntime,
  isUnkeyedLocalAdminAllowed,
} from './config';
import { CallerUserDoc, fetchCallerUserAccount, verifyFirebaseIdToken } from './firebaseAuth';
import { timingSafeMatch } from './quotationTokens';

export const ALL_STAFF_ROLES = [
  'super_admin',
  'admin',
  'content_manager',
  'sales_officer',
  'project_manager',
  'support_officer',
] as const;

export const ADMIN_ONLY_ROLES = ['super_admin', 'admin'] as const;

export interface AdminAuthResult {
  authorized: boolean;
  statusCode: number;
  mode: 'firebase-rbac' | 'access-key' | 'local-dev-unkeyed';
  uid?: string;
  role?: string;
  error?: string;
}

export interface AdminAuthDeps {
  verifyToken?: (token: string) => Promise<{ uid: string; emailVerified: boolean }>;
  fetchUser?: (token: string, uid: string) => Promise<CallerUserDoc | null>;
  env?: NodeJS.ProcessEnv;
}

export async function evaluateAdminRequest(
  req: Pick<Request, 'headers'>,
  allowedRoles: readonly string[] = ALL_STAFF_ROLES,
  deps: AdminAuthDeps = {}
): Promise<AdminAuthResult> {
  const env = deps.env ?? process.env;
  const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization.trim() : '';

  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const idToken = authHeader.slice(7).trim();
    if (!idToken) {
      return {
        authorized: false,
        statusCode: 401,
        mode: 'firebase-rbac',
        error: 'Bearer token is empty.',
      };
    }

    try {
      const verifyFn = deps.verifyToken ?? verifyFirebaseIdToken;
      const fetchUserFn = deps.fetchUser ?? fetchCallerUserAccount;
      const decoded = await verifyFn(idToken);
      if (!decoded.emailVerified) {
        return {
          authorized: false,
          statusCode: 403,
          mode: 'firebase-rbac',
          error: 'Verified email address required for staff operations.',
        };
      }
      const userDoc = await fetchUserFn(idToken, decoded.uid);
      if (!userDoc || !userDoc.active) {
        return {
          authorized: false,
          statusCode: 403,
          mode: 'firebase-rbac',
          error: 'User account is missing or deactivated.',
        };
      }
      if (!allowedRoles.includes(userDoc.role)) {
        return {
          authorized: false,
          statusCode: 403,
          mode: 'firebase-rbac',
          error: 'Insufficient staff role permissions.',
        };
      }
      return {
        authorized: true,
        statusCode: 200,
        mode: 'firebase-rbac',
        uid: decoded.uid,
        role: userDoc.role,
      };
    } catch (err) {
      return {
        authorized: false,
        statusCode: 401,
        mode: 'firebase-rbac',
        error: err instanceof Error ? err.message : 'Invalid Firebase authentication token.',
      };
    }
  }

  const configuredKey = env.ADMIN_ACCESS_KEY?.trim() || '';
  const providedKey = typeof req.headers['x-admin-token'] === 'string' ? req.headers['x-admin-token'].trim() : '';

  if (configuredKey) {
    if (providedKey && timingSafeMatch(providedKey, configuredKey)) {
      return {
        authorized: true,
        statusCode: 200,
        mode: 'access-key',
        role: 'server_key_admin',
      };
    }
    return {
      authorized: false,
      statusCode: 401,
      mode: 'access-key',
      error: 'Administrative authentication required. Sign in with an authorised staff account or provide a valid server token.',
    };
  }

  // Unkeyed access ONLY when explicitly opted-in for isolated non-production local development
  if (isUnkeyedLocalAdminAllowed(env)) {
    return {
      authorized: true,
      statusCode: 200,
      mode: 'local-dev-unkeyed',
      role: 'local_dev_admin',
    };
  }

  const firebaseEnabled = isFirebaseFeatureEnabledServer(env);
  if (firebaseEnabled) {
    return {
      authorized: false,
      statusCode: 401,
      mode: 'firebase-rbac',
      error: 'Administrative authentication required via verified Firebase Staff Bearer token.',
    };
  }

  if (env.NODE_ENV === 'production' || isServerlessRuntime(env)) {
    return {
      authorized: false,
      statusCode: 503,
      mode: 'access-key',
      error: 'Administrative routes require Firebase Authentication or a server-configured ADMIN_ACCESS_KEY.',
    };
  }

  return {
    authorized: false,
    statusCode: 401,
    mode: 'access-key',
    error: 'Unkeyed admin access is disabled. Sign in with Firebase Auth, configure ADMIN_ACCESS_KEY, or set ALLOW_UNKEYED_LOCAL_ADMIN="true" only for isolated local development.',
  };
}

export function requireAdminAccess(allowedRoles: readonly string[] = ALL_STAFF_ROLES) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await evaluateAdminRequest(req, allowedRoles);
    if (!result.authorized) {
      return res.status(result.statusCode).json({
        error: result.error,
        requiresAuth: true,
      });
    }
    (req as Request & { adminContext?: AdminAuthResult }).adminContext = result;
    return next();
  };
}
