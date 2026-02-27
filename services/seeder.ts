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
        console.log('Starting seed process with robust mapping...');

        // 1. Create Users
        const seededUsers: User[] = [];
        for (const userData of USERS_TO_SEED) {
            const { data: foundUsers, error: searchError } = await supabase
                .from('app_users')
                .select('*')
                .eq('email', userData.email);

            if (searchError) console.error(`Error searching for ${userData.email}:`, searchError);

            const existing = foundUsers && foundUsers.length > 0 ? foundUsers[0] : null;

            if (existing) {
                const mappedUser: User = {
                    id: existing.id || existing.userId || generateId(),
                    name: existing.name || existing.userName || userData.name,
                    email: existing.email || userData.email,
                    role: existing.role || userData.role,
                    isActive: existing.isActive !== undefined ? existing.isActive : true,
                    createdAt: existing.createdAt || existing.created_at || new Date().toISOString()
                };
                seededUsers.push(mappedUser);
                console.log(`User found and mapped: ${mappedUser.name} (${mappedUser.id})`);
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

                const payload = {
                    ...newUser,
                    created_at: newUser.createdAt
                };

                const { error } = await supabase.from('app_users').insert(payload);
                if (error) {
                    console.error(`Failed to create user ${userData.name}:`, error);
                } else {
                    seededUsers.push(newUser);
                    console.log(`Created new user: ${userData.name} (${newUser.id})`);
                }
            }
        }

        // 2. Create Folders
        const seededFolders: TaskFolder[] = [];
        for (const user of seededUsers) {
            for (const folderName of FOLDER_NAMES) {
                const { data: existing } = await supabase
                    .from('task_folders')
                    .select('*')
                    .eq('owner_id', user.id)
                    .eq('name', folderName)
                    .limit(1);

                if (existing && existing.length > 0) {
                    const f = existing[0];
                    seededFolders.push({
                        id: f.id,
                        name: f.name,
                        type: f.type,
                        ownerId: f.owner_id || f.ownerId,
                        visibility: f.visibility,
                        accessibleUserIds: f.accessible_user_ids || f.accessibleUserIds || [],
                        createdAt: f.created_at || f.createdAt
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
                    if (!error) seededFolders.push(newFolder);
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
                    description: `Task for ${client}.`,
                    client: client,
                    assignedUserId: user.id,
                    collaboratorIds: collaborators,
                    folderId: folder?.id,
                    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    timeEstimate: 10,
                    status: ProjectTaskStatus.IN_PROGRESS,
                    priority: ProjectTaskPriority.MEDIUM,
                    isCollaborative: isCollaborative,
                    createdAt: new Date().toISOString()
                };

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
                if (!error) seededTasks.push(newTask);
            }
        }

        // 4. Create Daily Updates
        const today = new Date();
        for (let d = 1; d <= 5; d++) {
            const date = new Date(today);
            date.setDate(today.getDate() - d);
            const dateStr = date.toISOString().split('T')[0];

            for (const user of seededUsers) {
                const { data: existing } = await supabase
                    .from('daily_updates')
                    .select('id')
                    .eq('userId', user.id)
                    .eq('date', dateStr);

                if (foundUsers && foundUsers.length > 0) {
                    // Check if ANY record exists for this date/user
                    const { data: check } = await supabase.from('daily_updates').select('id').eq('userId', user.id).eq('date', dateStr).limit(1);
                    if (check && check.length > 0) continue;
                }

                const userTasks = seededTasks.filter(t => t.assignedUserId === user.id || t.collaboratorIds.includes(user.id));
                const dailyTasks = userTasks.slice(0, 3).map(t => ({
                    id: generateId(),
                    description: `Worked on ${t.title}`,
                    timeSpent: 3,
                    category: TaskCategory.HPA,
                    projectTaskId: t.id
                }));

                const totalTime = dailyTasks.reduce((sum, t) => sum + t.timeSpent, 0);

                const updatePayload = {
                    id: generateId(),
                    userId: user.id,
                    userName: user.name,
                    date: dateStr,
                    month: dateStr.substring(0, 7),
                    tasks: dailyTasks,
                    missedTasks: [],
                    blockers: [],
                    productivityScore: 8,
                    totalTime: totalTime,
                    submittedAt: new Date().toISOString()
                };

                const { error } = await supabase.from('daily_updates').insert(updatePayload);
                if (error) console.error(`Error creating update for ${user.name} on ${dateStr}:`, error);
            }
        }

        alert('Seeding complete! Please refresh.');
        return true;

    } catch (err) {
        console.error('Seeding failed:', err);
        alert('Seeding failed. Check console.');
        return false;
    }
};
