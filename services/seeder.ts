import { supabase } from './supabaseClient';
import { DailyWorkUpdate, TaskCategory, User, UserRole } from '../types';

const DUMMY_UPDATES_DATA = [
    {
        date: '2026-01-06',
        tasks: [
            { description: 'Reviewing inbound LinkedIn inmails', timeSpent: 1.5, category: TaskCategory.CTA },
            { description: 'Internal ops planning', timeSpent: 2, category: TaskCategory.LPA },
            { description: 'Drafting outreach copy', timeSpent: 1, category: TaskCategory.CTA },
        ],
        missedTasks: [
            { description: 'Weekly analytics review', reason: 'Ran out of time due to ops discussions' }
        ],
        blockers: [
            { description: 'Waiting for access to analytics dashboard', reason: 'Permissions pending' }
        ],
        productivityScore: 7
    },
    {
        date: '2026-01-09',
        tasks: [
            { description: 'Inmails checking for founder', timeSpent: 2, category: TaskCategory.CTA },
            { description: 'Campaign copy revisions', timeSpent: 1.5, category: TaskCategory.HPA },
            { description: 'Team sync call', timeSpent: 1, category: TaskCategory.LPA },
        ],
        missedTasks: [],
        blockers: [],
        productivityScore: 8
    },
    {
        date: '2026-01-13',
        tasks: [
            { description: 'Founder LinkedIn inmails follow-ups', timeSpent: 2, category: TaskCategory.CTA },
            { description: 'Lead list cleanup', timeSpent: 1.5, category: TaskCategory.LPA },
            { description: 'Drafting new campaign angle', timeSpent: 1, category: TaskCategory.HPA },
        ],
        missedTasks: [
            { description: 'CRM update', reason: 'Lead data incomplete' }
        ],
        blockers: [
            { description: 'Inconsistent lead data', reason: 'Source sheet outdated' }
        ],
        productivityScore: 7
    },
    {
        date: '2026-01-17',
        tasks: [
            { description: 'Strategy discussion with founder', timeSpent: 2, category: TaskCategory.HPA },
            { description: 'Cleaning lead database', timeSpent: 2, category: TaskCategory.LPA },
            { description: 'Checking inmails for founder', timeSpent: 1, category: TaskCategory.CTA },
        ],
        missedTasks: [
            { description: 'Outreach scheduling', reason: 'Strategy discussion overran' }
        ],
        blockers: [],
        productivityScore: 6
    },
    {
        date: '2026-01-22',
        tasks: [
            { description: 'Reviewing campaign performance', timeSpent: 1.5, category: TaskCategory.HPA },
            { description: 'Inmail responses for founder', timeSpent: 2, category: TaskCategory.CTA },
            { description: 'Ops documentation', timeSpent: 1, category: TaskCategory.LPA },
        ],
        missedTasks: [],
        blockers: [
            { description: 'Delay in performance data', reason: 'Tracking not updated' }
        ],
        productivityScore: 8
    },
    {
        date: '2026-02-03',
        tasks: [
            { description: 'Checking LinkedIn inmails', timeSpent: 1.5, category: TaskCategory.CTA },
            { description: 'Internal process improvement planning', timeSpent: 2, category: TaskCategory.HPA },
            { description: 'Admin follow-ups', timeSpent: 1, category: TaskCategory.LPA },
        ],
        missedTasks: [
            { description: 'Outreach copy rewrite', reason: 'Pulled into admin work' }
        ],
        blockers: [
            { description: 'Too many ad-hoc admin requests', reason: 'No task prioritization' }
        ],
        productivityScore: 6
    },
    {
        date: '2026-02-07',
        tasks: [
            { description: 'Founder inmails management', timeSpent: 2, category: TaskCategory.CTA },
            { description: 'Drafting SOP for outreach', timeSpent: 1.5, category: TaskCategory.HPA },
            { description: 'Internal alignment call', timeSpent: 1, category: TaskCategory.LPA },
        ],
        missedTasks: [
            { description: 'Lead sourcing', reason: 'SOP drafting took longer' }
        ],
        blockers: [],
        productivityScore: 7
    },
    {
        date: '2026-02-12',
        tasks: [
            { description: 'Reviewing founder LinkedIn messages', timeSpent: 2, category: TaskCategory.CTA },
            { description: 'Campaign optimization planning', timeSpent: 1.5, category: TaskCategory.HPA },
            { description: 'Lead sheet cleanup', timeSpent: 1, category: TaskCategory.LPA },
        ],
        missedTasks: [],
        blockers: [],
        productivityScore: 8
    },
    {
        date: '2026-02-18',
        tasks: [
            { description: 'Inmails checking & responses', timeSpent: 2, category: TaskCategory.CTA },
            { description: 'Ops backlog cleanup', timeSpent: 2, category: TaskCategory.LPA },
            { description: 'Strategy notes for next sprint', timeSpent: 1, category: TaskCategory.HPA },
        ],
        missedTasks: [
            { description: 'Outreach experiments', reason: 'Ops backlog heavier than expected' }
        ],
        blockers: [
            { description: 'Accumulated operational debt', reason: 'Repeated manual work' }
        ],
        productivityScore: 6
    },
    {
        date: '2026-02-24',
        tasks: [
            { description: 'Founder inmails review', timeSpent: 1.5, category: TaskCategory.CTA },
            { description: 'Monthly performance reflection', timeSpent: 2, category: TaskCategory.HPA },
            { description: 'Documentation updates', timeSpent: 1, category: TaskCategory.LPA },
        ],
        missedTasks: [],
        blockers: [],
        productivityScore: 8
    }
];

export const seedDummyData = async () => {
    try {
        console.log('Starting seed process...');

        // 1. Check if user exists, if not create
        const email = 'sanyam@myntmore.com';
        let userId = '';
        let userName = 'Sanyam Golechha'; // Ensure we use this name

        const { data: users, error: searchError } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', email)
            .single();

        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is 'not found'
            throw searchError;
        }

        if (users) {
            console.log('User found:', users);
            userId = users.id;
            // Update name just in case
            userName = users.name;
        } else {
            console.log('Creating new user...');
            const newUser: User = {
                id: Math.random().toString(36).substr(2, 9),
                name: userName,
                email: email,
                // Since we don't have password hashing yet, strict password
                password: 'password123',
                role: UserRole.USER,
                isActive: true,
                createdAt: new Date().toISOString()
            };

            const { error: createError } = await supabase
                .from('app_users')
                .insert(newUser);

            if (createError) throw createError;
            userId = newUser.id;
        }

        // 2. Insert updates
        for (const entry of DUMMY_UPDATES_DATA) {
            const totalTime = entry.tasks.reduce((sum, t) => sum + t.timeSpent, 0);

            // Calculate tasks with IDs
            const tasksWithIds = entry.tasks.map(t => ({
                ...t,
                id: Math.random().toString(36).substr(2, 9)
            }));

            const missedTasksWithIds = entry.missedTasks.map(m => ({
                ...m,
                id: Math.random().toString(36).substr(2, 9)
            }));

            const blockersWithIds = entry.blockers.map(b => ({
                ...b,
                id: Math.random().toString(36).substr(2, 9)
            }));

            const updatePayload: DailyWorkUpdate = {
                id: Math.random().toString(36).substr(2, 9),
                userId: userId,
                userName: userName,
                date: entry.date,
                month: entry.date.substring(0, 7),
                tasks: tasksWithIds,
                missedTasks: missedTasksWithIds,
                blockers: blockersWithIds,
                productivityScore: entry.productivityScore,
                totalTime: totalTime,
                submittedAt: new Date().toISOString()
            };

            // Check if update exists for this date to avoid dupes (optional but good)
            const { data: existing } = await supabase
                .from('daily_updates')
                .select('id')
                .eq('userId', userId)
                .eq('date', entry.date);

            if (existing && existing.length > 0) {
                console.log(`Update for ${entry.date} already exists. Skipping.`);
                continue;
            }

            const { error: insertError } = await supabase
                .from('daily_updates')
                .insert(updatePayload);

            if (insertError) {
                console.error(`Failed to insert update for ${entry.date}:`, insertError);
            } else {
                console.log(`inserted update for ${entry.date}`);
            }
        }

        alert('Dummy data seeding complete!');
        return true;

    } catch (err) {
        console.error('Seeding failed:', err);
        alert('Seeding failed. Check console.');
        return false;
    }
};
