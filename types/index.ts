import { UserRole } from '@/models/User';
import { WorkCategory, WorkPriority, WorkStatus } from '@/models/Work';
import { ActivityAction } from '@/models/Activity';

export type { UserRole, WorkCategory, WorkPriority, WorkStatus, ActivityAction };

export interface UserDTO {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WorkDTO {
  id: string;
  title: string;
  description?: string;
  category: WorkCategory;
  priority: WorkPriority;
  deadline: string;
  status: WorkStatus;
  assignedTo: UserDTO[];
  createdBy: UserDTO;
  completedAt?: string;
  completedBy?: UserDTO;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: string;
  workId: string;
  user: UserDTO;
  message: string;
  createdAt: string;
}

export interface ActivityDTO {
  id: string;
  workId: string;
  user: UserDTO;
  action: ActivityAction;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
