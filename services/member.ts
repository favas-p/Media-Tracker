import { UserDTO } from '@/types';
import { CreateMemberInput, UpdateMemberInput, ResetPasswordInput } from '@/validators/auth';

export async function fetchMembers(params?: { role?: string; includeInactive?: boolean }): Promise<UserDTO[]> {
  const urlParams = new URLSearchParams();
  if (params?.role) urlParams.append('role', params.role);
  if (params?.includeInactive) urlParams.append('includeInactive', 'true');

  const res = await fetch(`/api/members?${urlParams.toString()}`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch team members');
  return data.data;
}

export async function createMember(input: CreateMemberInput): Promise<UserDTO> {
  const res = await fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create member');
  return data.data;
}

export async function updateMember(id: string, input: UpdateMemberInput): Promise<UserDTO> {
  const res = await fetch(`/api/members/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update member');
  return data.data;
}

export async function resetMemberPassword(id: string, input: ResetPasswordInput): Promise<void> {
  const res = await fetch(`/api/members/${id}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to reset password');
}
