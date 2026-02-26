
import { User, DailyWorkUpdate, ProjectTask, TaskFolder } from '../types';
import { supabase } from './supabaseClient';

export const storageService = {
  init: async () => {
    // No-op for Supabase, or verify connection
  },

  // Auth & User Management
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('app_users').select('*');
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return data || [];
  },

  saveUser: async (user: User): Promise<void> => {
    const { error } = await supabase.from('app_users').upsert(user);
    if (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    // 1. Delete associated data first to handle foreign key constraints
    await supabase.from('daily_updates').delete().eq('userId', userId);
    await supabase.from('project_tasks').delete().eq('assignedUserId', userId);
    await supabase.from('task_folders').delete().eq('ownerId', userId);

    // 2. Delete the user
    const { error } = await supabase.from('app_users').delete().eq('id', userId);
    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Work Updates
  getUpdates: async (): Promise<DailyWorkUpdate[]> => {
    const { data, error } = await supabase.from('daily_updates').select('*');
    if (error) {
      console.error('Error fetching updates:', error);
      return [];
    }
    return data || [];
  },

  saveUpdate: async (update: DailyWorkUpdate): Promise<boolean> => {
    // Check if user already submitted for this date
    const { data: existing } = await supabase
      .from('daily_updates')
      .select('id')
      .eq('userId', update.userId)
      .eq('date', update.date);

    if (existing && existing.length > 0) {
      return false;
    }

    const { error } = await supabase.from('daily_updates').insert(update);
    if (error) {
      console.error('Error saving update:', error);
      throw error;
    }
    return true;
  },

  getUpdatesByUser: async (userId: string): Promise<DailyWorkUpdate[]> => {
    const { data } = await supabase.from('daily_updates').select('*').eq('userId', userId);
    return data || [];
  },

  getUpdatesByMonth: async (month: string): Promise<DailyWorkUpdate[]> => {
    const { data } = await supabase.from('daily_updates').select('*').eq('month', month);
    return data || [];
  },

  // Project Task Management
  getTasks: async (): Promise<ProjectTask[]> => {
    const { data, error } = await supabase.from('project_tasks').select('*');
    if (error) {
      console.error('Error fetching project tasks:', error);
      return [];
    }
    return data || [];
  },

  getTasksByUser: async (userId: string): Promise<ProjectTask[]> => {
    const { data, error } = await supabase
      .from('project_tasks')
      .select('*')
      .or(`assignedUserId.eq.${userId},collaboratorIds.cs.{${userId}}`);
    if (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }
    return data || [];
  },

  saveTask: async (task: ProjectTask): Promise<void> => {
    const { error } = await supabase.from('project_tasks').upsert(task);
    if (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Folder Management
  getFolders: async (userId: string, isAdmin: boolean): Promise<TaskFolder[]> => {
    let query = supabase.from('task_folders').select('*');

    if (!isAdmin) {
      // Non-admins see: PUBLIC folders, or folders where they are the owner, or folders where they are in accessibleUserIds
      query = query.or(`visibility.eq.PUBLIC,ownerId.eq.${userId},accessibleUserIds.cs.{${userId}}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
    return data || [];
  },

  saveFolder: async (folder: TaskFolder): Promise<void> => {
    const { error } = await supabase.from('task_folders').upsert(folder);
    if (error) {
      console.error('Error saving folder:', error);
      throw error;
    }
  },

  deleteFolder: async (folderId: string): Promise<void> => {
    // Note: In real app, might want to handle task cleanup or move
    const { error } = await supabase.from('task_folders').delete().eq('id', folderId);
    if (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }
};
