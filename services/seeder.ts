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

// Deterministic ID generator to prevent duplicates across runs
const getDeterministicId = (prefix: string, ...parts: string[]) => {
    const str = `${prefix}_${parts.join('_').replace(/\s+/g, '_').toLowerCase()}`;
    return str.substring(0, 50); // Keep within reasonable length
};

export const seedDummyData = async () => {
    try {
        console.log('Starting seed process v4 (Safe & Deterministic)...');

        // 1. Create/Sync Users (Stable IDs based on email)
        const seededUsers: User[] = [];
        for (const userData of USERS_TO_SEED) {
            const userId = getDeterministicId('u', userData.email);

            const newUser: User = {
                id: userId,
                name: userData.name,
                email: userData.email,
                password: 'password123',
                role: userData.role,
                isActive: true,
                createdAt: new Date().toISOString()
            };

            const { error } = await supabase.from('app_users').upsert(newUser);
            if (!error) {
                seededUsers.push(newUser);
                console.log(`Synced user: ${userData.name}`);
            }
        }

        // 2. Create Folders (Deterministic IDs per user/folder)
        const seededFolders: TaskFolder[] = [];
        for (const user of seededUsers) {
            for (const folderName of FOLDER_NAMES) {
                const folderId = getDeterministicId('f', user.id, folderName);
                const newFolder: TaskFolder = {
                    id: folderId,
                    name: folderName,
                    type: user.role === UserRole.ADMIN ? FolderType.ADMIN : FolderType.USER,
                    ownerId: user.id,
                    visibility: FolderVisibility.PUBLIC,
                    accessibleUserIds: [],
                    createdAt: new Date().toISOString()
                };

                const { error } = await supabase.from('task_folders').upsert(newFolder);
                if (!error) seededFolders.push(newFolder);
            }
        }

        // 3. Create Project Tasks (Deterministic IDs per user/task index)
        const seededTasks: ProjectTask[] = [];
        for (const user of seededUsers) {
            const userFolders = seededFolders.filter(f => f.ownerId === user.id);
            for (let i = 0; i < 5; i++) {
                const folder = userFolders[i % userFolders.length];
                const client = CLIENTS[i % CLIENTS.length];
                const taskId = getDeterministicId('t', user.id, client, i.toString());

                const newTask: ProjectTask = {
                    id: taskId,
                    title: `${client} Project Phase ${i + 1}`,
                    description: `Core delivery for ${client}.`,
                    client: client,
                    assignedUserIds: [user.id],
                    collaboratorIds: [],
                    folderId: folder?.id,
                    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                    timeEstimate: 10,
                    status: ProjectTaskStatus.IN_PROGRESS,
                    priority: ProjectTaskPriority.MEDIUM,
                    isCollaborative: false,
                    createdAt: new Date().toISOString()
                };

                const { error } = await supabase.from('project_tasks').upsert(newTask);
                if (!error) seededTasks.push(newTask);
            }
        }

        // 4. Create Daily Updates (Deterministic IDs per user/date)
        const today = new Date();
        for (let d = 0; d < 5; d++) {
            const date = new Date(today);
            date.setDate(today.getDate() - d);
            const dateStr = date.toISOString().split('T')[0];

            for (const user of seededUsers) {
                const updateId = getDeterministicId('upd', user.id, dateStr);
                const userTasks = seededTasks.filter(t => t.assignedUserIds.includes(user.id));

                const dailyTasks = userTasks.slice(0, 2).map((t, idx) => ({
                    id: `${updateId}_dt_${idx}`,
                    description: `Work on ${t.title}`,
                    timeSpent: 4,
                    category: TaskCategory.HPA,
                    projectTaskId: t.id
                }));

                const totalTime = dailyTasks.reduce((sum, t) => sum + t.timeSpent, 0);

                const updatePayload: DailyWorkUpdate = {
                    id: updateId,
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

                await supabase.from('daily_updates').upsert(updatePayload);
            }
        }

        alert('Safe seeding complete! All entries are now unique and stable.');
        return true;

    } catch (err) {
        console.error('Seeding failed:', err);
        return false;
    }

};
