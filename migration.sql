-- Migration to support Multiple Assignees
-- Drops the old column and index, and adds the new array column and primary owner column.

-- 1. Drop the old index
DROP INDEX IF EXISTS idx_tasks_assigned_user;

-- 2. Add the new columns
ALTER TABLE project_tasks 
ADD COLUMN "assignedUserIds" TEXT[] DEFAULT '{}',
ADD COLUMN "primaryOwnerId" TEXT REFERENCES app_users(id);

-- 3. Migrate data (Copy assignedUserId into assignedUserIds array, and set as primary owner)
-- Note: Assuming you run this on existing data before dropping the column.
UPDATE project_tasks
SET "assignedUserIds" = ARRAY["assignedUserId"],
    "primaryOwnerId" = "assignedUserId";

-- 4. Drop old column
ALTER TABLE project_tasks 
DROP COLUMN "assignedUserId";

-- 5. Create new index for array
CREATE INDEX idx_tasks_assigned_users ON project_tasks USING GIN ("assignedUserIds");
