-- Myntmore Work Update Tracker - Database Schema
-- Optimized for Supabase/PostgreSQL

-- 1. Users Table
CREATE TABLE app_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT NOT NULL, -- 'ADMIN' | 'USER'
    "jobRole" TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Folders Table
CREATE TABLE task_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'USER' | 'ADMIN'
    "ownerId" TEXT NOT NULL REFERENCES app_users(id),
    visibility TEXT NOT NULL, -- 'PUBLIC' | 'PRIVATE' | 'SELECTIVE'
    "accessibleUserIds" TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tasks Table
CREATE TABLE project_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client TEXT NOT NULL,
    "assignedUserIds" TEXT[] DEFAULT '{}',
    "primaryOwnerId" TEXT REFERENCES app_users(id),
    "collaboratorIds" TEXT[] DEFAULT '{}',
    "folderId" TEXT REFERENCES task_folders(id),
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "timeEstimate" FLOAT NOT NULL, -- in hours
    status TEXT NOT NULL, -- 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'
    priority TEXT NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
    "isCollaborative" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Daily Updates Table
CREATE TABLE daily_updates (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES app_users(id),
    "userName" TEXT NOT NULL,
    date DATE NOT NULL,
    month TEXT NOT NULL, -- 'YYYY-MM'
    tasks JSONB NOT NULL DEFAULT '[]',
    "missedTasks" JSONB NOT NULL DEFAULT '[]',
    blockers JSONB NOT NULL DEFAULT '[]',
    "productivityScore" INTEGER NOT NULL,
    "totalTime" FLOAT NOT NULL,
    "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("userId", date)
);

-- Indexing for performance
CREATE INDEX idx_tasks_assigned_users ON project_tasks USING GIN ("assignedUserIds");
CREATE INDEX idx_updates_user_date ON daily_updates("userId", date);
CREATE INDEX idx_folders_owner ON task_folders("ownerId");
