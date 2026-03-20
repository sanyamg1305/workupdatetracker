-- Migration to support Subtasks
-- Run this in your Supabase SQL editor

ALTER TABLE project_tasks ADD COLUMN subtasks JSONB DEFAULT '[]';
