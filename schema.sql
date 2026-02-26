-- Create Folder Type Enum
-- Note: Replace UUID with TEXT if your app_users table uses text IDs (the current storageService uses Math.random strings)
-- Given the current app uses random string IDs, we'll use TEXT for IDs.

CREATE TABLE task_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'USER' | 'ADMIN'
    owner_id TEXT NOT NULL,
    visibility TEXT NOT NULL, -- 'PUBLIC' | 'PRIVATE' | 'SELECTIVE'
    accessible_user_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE project_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client TEXT NOT NULL,
    assigned_user_id TEXT NOT NULL,
    collaborator_ids TEXT[] DEFAULT '{}',
    folder_id TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    time_estimate FLOAT NOT NULL, -- in hours
    status TEXT NOT NULL, -- 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'
    priority TEXT NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
    is_collaborative BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for performance
-- CREATE INDEX idx_tasks_assigned_user ON project_tasks(assigned_user_id);
-- CREATE INDEX idx_tasks_folder ON project_tasks(folder_id);
-- CREATE INDEX idx_tasks_client ON project_tasks(client);
