import { WorkDTO, CommentDTO, ActivityDTO } from '@/types';
import { CreateWorkInput, UpdateWorkInput } from '@/validators/work';

export async function fetchWorks(params?: {
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  myWorks?: boolean;
  search?: string;
}): Promise<WorkDTO[]> {
  const urlParams = new URLSearchParams();
  if (params?.status) urlParams.append('status', params.status);
  if (params?.category) urlParams.append('category', params.category);
  if (params?.priority) urlParams.append('priority', params.priority);
  if (params?.assignedTo) urlParams.append('assignedTo', params.assignedTo);
  if (params?.myWorks) urlParams.append('myWorks', 'true');
  if (params?.search) urlParams.append('search', params.search);

  const res = await fetch(`/api/works?${urlParams.toString()}`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch works');
  return data.data;
}

export async function fetchWorkById(id: string): Promise<{
  work: WorkDTO;
  comments: CommentDTO[];
  activities: ActivityDTO[];
}> {
  const res = await fetch(`/api/works/${id}`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch work details');
  return data.data;
}

export async function createWork(input: CreateWorkInput): Promise<WorkDTO> {
  const res = await fetch('/api/works', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create work');
  return data.data;
}

export async function updateWork(id: string, input: UpdateWorkInput): Promise<WorkDTO> {
  const res = await fetch(`/api/works/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update work');
  return data.data;
}

export async function updateWorkStatus(id: string, status: 'pending' | 'in_progress' | 'completed'): Promise<WorkDTO> {
  const res = await fetch(`/api/works/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update status');
  return data.data;
}

export async function deleteWork(id: string): Promise<void> {
  const res = await fetch(`/api/works/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete work');
}

export async function addWorkComment(id: string, message: string): Promise<CommentDTO> {
  const res = await fetch(`/api/works/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to post comment');
  return data.data;
}

