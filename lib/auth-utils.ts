import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/models/User';
import { NextResponse } from 'next/server';

export async function getServerUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getServerUser();
  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'chairman' && user.role !== 'convener') {
    throw new Error('Forbidden: Admin (Chairman/Convener) access required');
  }
  return user;
}

export function isAdminRole(role?: UserRole): boolean {
  return role === 'chairman' || role === 'convener';
}

// Simple in-memory rate limiter for login route
const attemptsMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(identifier: string, limit = 5, windowMs = 60 * 1000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = attemptsMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    attemptsMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Forbidden: Permission denied'): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}
