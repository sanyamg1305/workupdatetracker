
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
