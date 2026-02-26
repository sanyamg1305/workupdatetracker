
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum TaskCategory {
  HPA = 'HPA', // High Priority / High Impact
  LPA = 'LPA', // Low Priority / Ops / Admin
  CTA = 'CTA'  // Client / Revenue / Growth
}

export interface Task {
  id: string;
  description: string;
  timeSpent: number;
  category: TaskCategory;
}

export interface MissedTask {
  id: string;
  description: string;
  reason: string;
}

export interface Blocker {
  id: string;
  description: string;
  reason: string;
}

export interface DailyWorkUpdate {
  id: string;
  userId: string;
  userName: string;
  date: string;
  month: string; // YYYY-MM
  tasks: Task[];
  missedTasks: MissedTask[];
  blockers: Blocker[];
  productivityScore: number;
  totalTime: number;
  submittedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  jobRole?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface MonthlyStats {
  userId: string;
  name: string;
  updatesSubmitted: number;
  totalHours: number;
  avgProductivity: number;
  daysMissed: number;
}

export enum ProjectTaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum ProjectTaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum FolderType {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum FolderVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  SELECTIVE = 'SELECTIVE'
}

export interface TaskFolder {
  id: string;
  name: string;
  type: FolderType;
  ownerId: string;
  visibility: FolderVisibility;
  accessibleUserIds: string[]; // For SELECTIVE visibility
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  client: string;
  assignedUserId: string;
  collaboratorIds: string[];
  folderId?: string;
  startDate: string;
  endDate: string;
  timeEstimate: number; // In hours
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  isCollaborative: boolean;
  createdAt: string;
}
