import { supabase } from './supabaseClient';
import { DailyWorkUpdate, TaskCategory, User, UserRole, ProjectTask, TaskFolder, FolderType, FolderVisibility, ProjectTaskStatus, ProjectTaskPriority } from '../types';

const USERS_TO_SEED = [
    { name: 'Tejas Jhaveri', email: 'tejas@myntmore.com', role: UserRole.ADMIN },
    { name: 'Sanyam Raj Golechha', email: 'sanyam@myntmore.com', role: UserRole.USER },
    { name: 'Mithil Kothari', email: 'mithil@myntmore.com', role: UserRole.USER },
    { name: 'Jahnvi Jhaveri', email: 'jahnvi@myntmore.com', role: UserRole.USER },
    { name: 'Shirin Badlawala', email: 'shirin@myntmore.com', role: UserRole.USER },
    { name: 'Sneha Khemani', email: 'sneha@myntmore.com', role: UserRole.USER },
    { name: 'Anagha Suresh', email: 'anagha@myntmore.com', role: UserRole.USER },
    { name: 'Prerana Joshi', email: 'prerana@myntmore.com', role: UserRole.USER },
];

const CLIENTS = ['Myntmore', 'Snackdash', 'LinkedIn Campaign', 'GrowthOps', 'TechRevival'];
const FOLDER_NAMES = ['Client Deliverables', 'Internal SOPs', 'Research & Development', 'Admin Tasks', 'Strategic Planning'];

const generateId = () => Math.random().toString(36).substr(2, 9);

export const seedDummyData = async () => {
    try {
        console.log('Starting comprehensive seed process...');

        // 1. Create Users
        const seededUsers: User[] = [];
        for (const userData of USERS_TO_SEED) {
            const { data: existing } = await supabase
                .from('app_users')
                .select('*')
                .eq('email', userData.email)
                .single();

            if (existing) {
                seededUsers.push(existing);
                console.log(`User ${userData.name} already exists.`);
            } else {
                const newUser: User = {
                    id: generateId(),
                    name: userData.name,
                    email: userData.email,
                    password: 'password123',
                    role: userData.role,
                    isActive: true,
                    createdAt: new Date().toISOString()
                };
                const { error } = await supabase.from('app_users').insert(newUser);
                if (error) throw error;
                seededUsers.push(newUser);
                console.log(`Created user: ${userData.name}`);
            }
        }

        // 2. Create Folders for each user
        const seededFolders: TaskFolder[] = [];
        for (const user of seededUsers) {
            for (const folderName of FOLDER_NAMES) {
                // Check if folder exists
                const { data: existing } = await supabase
                    .from('task_folders')
                    .select('*')
                    .eq('owner_id', user.id)
                    .eq('name', folderName)
                    .single();

                if (existing) {
                    seededFolders.push({
                        id: (existing as any).id,
                        name: (existing as any).name,
                        type: (existing as any).type,
                        ownerId: (existing as any).owner_id,
                        visibility: (existing as any).visibility,
                        accessibleUserIds: (existing as any).accessible_user_ids || [],
                        createdAt: (existing as any).created_at
                    });
                } else {
                    const newFolder: TaskFolder = {
                        id: generateId(),
                        name: folderName,
                        type: user.role === UserRole.ADMIN ? FolderType.ADMIN : FolderType.USER,
                        ownerId: user.id,
                        visibility: FolderVisibility.PUBLIC,
                        accessibleUserIds: [],
                        createdAt: new Date().toISOString()
                    };

                    // Supabase schema uses snake_case
                    const payload = {
                        id: newFolder.id,
                        name: newFolder.name,
                        type: newFolder.type,
                        owner_id: newFolder.ownerId,
                        visibility: newFolder.visibility,
                        accessible_user_ids: newFolder.accessibleUserIds,
                        created_at: newFolder.createdAt
                    };

                    const { error } = await supabase.from('task_folders').insert(payload);
                    if (error) console.error('Error creating folder:', error);
                    else seededFolders.push(newFolder);
                }
            }
        }

        // 3. Create Project Tasks
        const seededTasks: ProjectTask[] = [];
        for (const user of seededUsers) {
            const userFolders = seededFolders.filter(f => f.ownerId === user.id);

            for (let i = 0; i < 5; i++) {
                const folder = userFolders[Math.floor(Math.random() * userFolders.length)];
                const client = CLIENTS[Math.floor(Math.random() * CLIENTS.length)];

                const isCollaborative = Math.random() > 0.7;
                const collaborators = isCollaborative
                    ? seededUsers.filter(u => u.id !== user.id).slice(0, 2).map(u => u.id)
                    : [];

                const newTask: ProjectTask = {
                    id: generateId(),
                    title: `${client} Task ${i + 1} for ${user.name.split(' ')[0]}`,
                    description: `Detailed description for ${client} task ${i + 1}. This involves various sub-tasks and milestones.`,
                    client: client,
                    assignedUserId: user.id,
                    collaboratorIds: collaborators,
                    folderId: folder?.id,
                    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    timeEstimate: Math.floor(Math.random() * 20) + 5,
                    status: i % 3 === 0 ? ProjectTaskStatus.COMPLETED : ProjectTaskStatus.IN_PROGRESS,
                    priority: i % 2 === 0 ? ProjectTaskPriority.HIGH : ProjectTaskPriority.MEDIUM,
                    isCollaborative: isCollaborative,
                    createdAt: new Date().toISOString()
                };

                // Supabase schema uses snake_case
                const payload = {
                    id: newTask.id,
                    title: newTask.title,
                    description: newTask.description,
                    client: newTask.client,
                    assigned_user_id: newTask.assignedUserId,
                    collaborator_ids: newTask.collaboratorIds,
                    folder_id: newTask.folderId,
                    start_date: newTask.startDate,
                    end_date: newTask.endDate,
                    time_estimate: newTask.timeEstimate,
                    status: newTask.status,
                    priority: newTask.priority,
                    is_collaborative: newTask.isCollaborative,
                    created_at: newTask.createdAt
                };

                const { error } = await supabase.from('project_tasks').insert(payload);
                if (error) console.error('Error creating task:', error);
                else seededTasks.push(newTask);
            }
        }

        // 4. Create Collaborative Tasks (Cross-team)
        const collaborativeTasks = [
            { title: 'Weekly All-Hands Preparation', client: 'Internal', collaborators: seededUsers.slice(0, 4).map(u => u.id) },
            { title: 'Main Client Q1 Strategy', client: 'Myntmore', collaborators: [seededUsers[0].id, seededUsers[1].id, seededUsers[2].id] },
            { title: 'New Service Line Brainstorming', client: 'GrowthOps', collaborators: seededUsers.slice(4).map(u => u.id) },
        ];

        for (const colTask of collaborativeTasks) {
            const newTask: ProjectTask = {
                id: generateId(),
                title: colTask.title,
                description: `Collaborative effort on ${colTask.title}`,
                client: colTask.client,
                assignedUserId: colTask.collaborators[0],
                collaboratorIds: colTask.collaborators.slice(1),
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                timeEstimate: 40,
                status: ProjectTaskStatus.IN_PROGRESS,
                priority: ProjectTaskPriority.HIGH,
                isCollaborative: true,
                createdAt: new Date().toISOString()
            };

            const payload = {
                id: newTask.id,
                title: newTask.title,
                description: newTask.description,
                client: newTask.client,
                assigned_user_id: newTask.assignedUserId,
                collaborator_ids: newTask.collaboratorIds,
                start_date: newTask.startDate,
                end_date: newTask.endDate,
                time_estimate: newTask.timeEstimate,
                status: newTask.status,
                priority: newTask.priority,
                is_collaborative: newTask.isCollaborative,
                created_at: newTask.createdAt
            };

            await supabase.from('project_tasks').insert(payload);
        }

        // 5. Create Daily Updates for the last 5 days
        const today = new Date();
        for (let d = 1; d <= 5; d++) {
            const date = new Date(today);
            date.setDate(today.getDate() - d);
            const dateStr = date.toISOString().split('T')[0];

            for (const user of seededUsers) {
                // Check if update exists
                const { data: existing } = await supabase
                    .from('daily_updates')
                    .select('id')
                    .eq('userId', user.id)
                    .eq('date', dateStr);

                if (existing && existing.length > 0) continue;

                const userTasks = seededTasks.filter(t => t.assignedUserId === user.id || t.collaboratorIds.includes(user.id));
                const dailyTasks = userTasks.slice(0, 3).map(t => ({
                    id: generateId(),
                    description: `Worked on ${t.title}`,
                    timeSpent: 2 + Math.random() * 2,
                    category: Math.random() > 0.5 ? TaskCategory.HPA : TaskCategory.CTA,
                    projectTaskId: t.id
                }));

                const totalTime = dailyTasks.reduce((sum, t) => sum + t.timeSpent, 0);

                const updatePayload: DailyWorkUpdate = {
                    id: generateId(),
                    userId: user.id,
                    userName: user.name,
                    date: dateStr,
                    month: dateStr.substring(0, 7),
                    tasks: dailyTasks,
                    missedTasks: [{ id: generateId(), description: 'Follow up emails', reason: 'Focus on project work', projectTaskId: undefined }],
                    blockers: Math.random() > 0.7 ? [{ id: generateId(), description: 'Waiting for client feedback', reason: 'Email sent on Monday' }] : [],
                    productivityScore: 7 + Math.floor(Math.random() * 3),
                    totalTime: totalTime,
                    submittedAt: new Date().toISOString()
                };

                const { error } = await supabase.from('daily_updates').insert(updatePayload);
                if (error) console.error(`Error creating update for ${user.name} on ${dateStr}:`, error);
            }
        }

        alert('Comprehensive dummy data seeding complete for 8 users!');
        return true;

    } catch (err) {
        console.error('Seeding failed:', err);
        alert('Seeding failed. Check console.');
        return false;
    }
};
