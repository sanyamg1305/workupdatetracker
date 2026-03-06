-- SQL Seed Script for Myntmore Work Update Tracker (SCHEMA SYNC + DETAILED SEEDING)
-- This script first aligns your database columns with the app code and then seeds data.

DO $$
BEGIN
    -- 1. SYNC TASK_FOLDERS SCHEMA (Align with app code camelCase)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_folders' AND column_name='owner_id') THEN
        ALTER TABLE task_folders RENAME COLUMN owner_id TO "ownerId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_folders' AND column_name='created_at') THEN
        ALTER TABLE task_folders RENAME COLUMN created_at TO "createdAt";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_folders' AND column_name='accessible_user_ids') THEN
        ALTER TABLE task_folders RENAME COLUMN accessible_user_ids TO "accessibleUserIds";
    END IF;

    -- 2. SYNC PROJECT_TASKS SCHEMA (Align with app code camelCase)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_tasks' AND column_name='assigned_user_id') THEN
        ALTER TABLE project_tasks RENAME COLUMN assigned_user_id TO "assignedUserId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_tasks' AND column_name='collaborator_ids') THEN
        ALTER TABLE project_tasks RENAME COLUMN collaborator_ids TO "collaboratorIds";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_tasks' AND column_name='folder_id') THEN
        ALTER TABLE project_tasks RENAME COLUMN folder_id TO "folderId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_tasks' AND column_name='start_date') THEN
        ALTER TABLE project_tasks RENAME COLUMN start_date TO "startDate";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_tasks' AND column_name='end_date') THEN
        ALTER TABLE project_tasks RENAME COLUMN end_date TO "endDate";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_tasks' AND column_name='time_estimate') THEN
        ALTER TABLE project_tasks RENAME COLUMN time_estimate TO "timeEstimate";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_tasks' AND column_name='created_at') THEN
        ALTER TABLE project_tasks RENAME COLUMN created_at TO "createdAt";
    END IF;
    
    -- Ensure "isCollaborative" exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_tasks' AND column_name='isCollaborative') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_tasks' AND column_name='is_collaborative') THEN
            ALTER TABLE project_tasks RENAME COLUMN is_collaborative TO "isCollaborative";
        ELSE
            ALTER TABLE project_tasks ADD COLUMN "isCollaborative" BOOLEAN DEFAULT FALSE;
        END IF;
    END IF;

END $$;

-- 3. DETAILED SEEDING
DO $$
DECLARE
    u RECORD;
    d DATE;
    task_json JSONB;
    missed_json JSONB;
    blocker_json JSONB;
    user_id_val TEXT;
    f_deliv_id TEXT;
    f_internal_id TEXT;
    f_research_id TEXT;
    prod_score INT;
    daily_hours FLOAT;
BEGIN
    -- Loop through the 8 specific users
    FOR u IN 
        SELECT id, name, email 
        FROM app_users 
        WHERE email IN (
            'tejas@myntmore.com', 'sanyam@myntmore.com', 'mithil@myntmore.com', 
            'jahnvi@myntmore.com', 'shirin@myntmore.com', 'sneha@myntmore.com', 
            'anagha@myntmore.com', 'prerana@myntmore.com'
        )
    LOOP
        user_id_val := u.id;
        
        -- Create Folders
        f_deliv_id := user_id_val || '_f_deliv';
        f_internal_id := user_id_val || '_f_int';
        f_research_id := user_id_val || '_f_res';

        INSERT INTO task_folders (id, name, type, "ownerId", visibility, "createdAt") VALUES 
            (f_deliv_id, 'Client Deliverables - Q1', 'USER', user_id_val, 'PUBLIC', NOW()),
            (f_internal_id, 'Internal Ops & SOPs', 'USER', user_id_val, 'PUBLIC', NOW()),
            (f_research_id, 'Deep Work & Research', 'USER', user_id_val, 'PUBLIC', NOW()),
            (user_id_val || '_f_admin', 'Admin & Meetings', 'USER', user_id_val, 'PUBLIC', NOW())
        ON CONFLICT (id) DO NOTHING;

        -- Create Project Tasks
        INSERT INTO project_tasks (id, title, description, client, "assignedUserId", "folderId", "startDate", "endDate", "timeEstimate", status, priority, "isCollaborative", "createdAt")
        VALUES (
            user_id_val || '_t1', 
            'High-Level Performance Audit', 
            'Reviewing current campaign metrics and identifying growth levers for the client.', 
            'Myntmore', 
            user_id_val, 
            f_deliv_id, 
            NOW() - INTERVAL '15 days', 
            NOW() + INTERVAL '5 days', 
            25.0, 
            'IN_PROGRESS', 
            'HIGH', 
            false, 
            NOW()
        ) ON CONFLICT (id) DO NOTHING;

        INSERT INTO project_tasks (id, title, description, client, "assignedUserId", "folderId", "startDate", "endDate", "timeEstimate", status, priority, "isCollaborative", "createdAt")
        VALUES (
            user_id_val || '_t2', 
            'Content Strategy & Execution', 
            'Development of weekly content buckets and visual assets for LinkedIn.', 
            'Snackdash', 
            user_id_val, 
            f_deliv_id, 
            NOW() - INTERVAL '4 days', 
            NOW() + INTERVAL '3 days', 
            12.0, 
            'IN_PROGRESS', 
            'MEDIUM', 
            false, 
            NOW()
        ) ON CONFLICT (id) DO NOTHING;

        INSERT INTO project_tasks (id, title, description, client, "assignedUserId", "folderId", "startDate", "endDate", "timeEstimate", status, priority, "isCollaborative", "createdAt")
        VALUES (
            user_id_val || '_t3', 
            'Workflow Automation v2', 
            'Setting up automated triggers for task tracking and status updates.', 
            'GrowthOps', 
            user_id_val, 
            f_internal_id, 
            NOW() - INTERVAL '2 days', 
            NOW() + INTERVAL '10 days', 
            8.0, 
            'NOT_STARTED', 
            'HIGH', 
            false, 
            NOW()
        ) ON CONFLICT (id) DO NOTHING;

        -- Seed Daily Updates (Last 5 Days)
        FOR d IN SELECT generate_series(CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '1 day', '1 day')::date LOOP
            
            prod_score := 7 + (floor(random() * 4))::int; 
            daily_hours := 5.5 + (random() * 3.5);

            IF (extract(dow from d) IN (1, 3, 5)) THEN 
                task_json := jsonb_build_array(
                    jsonb_build_object(
                        'id', user_id_val || '_dt_' || to_char(d, 'YYYYMMDD') || '_1',
                        'description', 'Analyzed Performance Audit data and drafted Q1 recommendations',
                        'timeSpent', 4.5,
                        'category', 'HPA',
                        'projectTaskId', user_id_val || '_t1'
                    ),
                    jsonb_build_object(
                        'id', user_id_val || '_dt_' || to_char(d, 'YYYYMMDD') || '_2',
                        'description', 'Weekly Sync with Client Success Team',
                        'timeSpent', 1.5,
                        'category', 'CTA'
                    )
                );
            ELSE 
                task_json := jsonb_build_array(
                    jsonb_build_object(
                        'id', user_id_val || '_dt_' || to_char(d, 'YYYYMMDD') || '_1',
                        'description', 'Created Content Strategy for Snackdash LinkedIn Campaign',
                        'timeSpent', 4.0,
                        'category', 'CTA',
                        'projectTaskId', user_id_val || '_t2'
                    ),
                    jsonb_build_object(
                        'id', user_id_val || '_dt_' || to_char(d, 'YYYYMMDD') || '_2',
                        'description', 'Process Documentation for Automation workflows',
                        'timeSpent', 2.5,
                        'category', 'HPA',
                        'projectTaskId', user_id_val || '_t3'
                    )
                );
            END IF;

            missed_json := '[]'::jsonb;
            IF (random() > 0.6) THEN
                missed_json := jsonb_build_array(
                    jsonb_build_object(
                        'id', user_id_val || '_mt_' || to_char(d, 'YYYYMMDD'),
                        'description', 'Finalize monthly invoice reports',
                        'reason', 'Priority shifted to urgent Performance Audit request'
                    )
                );
            END IF;

            blocker_json := '[]'::jsonb;
            IF (random() > 0.8) THEN
                blocker_json := jsonb_build_array(
                    jsonb_build_object(
                        'id', user_id_val || '_bl_' || to_char(d, 'YYYYMMDD'),
                        'description', 'Waiting for client credentials for Snackdash API',
                        'reason', 'Followed up via email today'
                    )
                );
            END IF;

            INSERT INTO daily_updates (
                id, "userId", "userName", date, month, tasks, "missedTasks", blockers, "productivityScore", "totalTime", "submittedAt"
            ) VALUES (
                user_id_val || '_upd_' || to_char(d, 'YYYYMMDD'),
                user_id_val,
                u.name,
                d,
                to_char(d, 'YYYY-MM'),
                task_json,
                missed_json,
                blocker_json,
                prod_score,
                round(daily_hours::numeric, 1),
                NOW()
            )
            ON CONFLICT ("userId", date) DO UPDATE SET
                tasks = EXCLUDED.tasks,
                "missedTasks" = EXCLUDED."missedTasks",
                blockers = EXCLUDED.blockers,
                "productivityScore" = EXCLUDED."productivityScore",
                "totalTime" = EXCLUDED."totalTime";
        END LOOP;

    END LOOP;
END $$;


