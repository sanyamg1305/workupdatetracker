
import { User, DailyWorkUpdate } from '../types';
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
  }
};
