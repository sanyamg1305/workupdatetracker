
import React, { useState, useEffect } from 'react';
import {
    ProjectTask,
    TaskFolder,
    User,
    UserRole,
    ProjectTaskStatus,
    ProjectTaskPriority,
    FolderType,
    FolderVisibility
} from '../types';
import { storageService } from '../services/storageService';
import { Icons, ACCENT_COLOR } from '../constants';

interface TaskSystemProps {
    user: User;
    users: User[];
}

const TaskSystem: React.FC<TaskSystemProps> = ({ user, users }) => {
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [folders, setFolders] = useState<TaskFolder[]>([]);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [view, setView] = useState<'MY_TASKS' | 'FOLDER' | 'ADMIN'>('MY_TASKS');
    const [isLoading, setIsLoading] = useState(true);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);

    useEffect(() => {
        fetchData();
    }, [user, view]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const isAdmin = user.role === UserRole.ADMIN;
            const fetchedFolders = await storageService.getFolders(user.id, isAdmin);
            setFolders(fetchedFolders);

            let fetchedTasks: ProjectTask[] = [];
            if (view === 'ADMIN' && isAdmin) {
                fetchedTasks = await storageService.getTasks();
            } else {
                fetchedTasks = await storageService.getTasksByUser(user.id);
            }
            setTasks(fetchedTasks);
        } catch (error) {
            console.error("Error fetching task data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (activeFolderId) return task.folderId === activeFolderId;
        if (view === 'MY_TASKS') return task.assignedUserId === user.id || task.collaboratorIds.includes(user.id);
        return true; // Admin view or all tasks
    });

    const activeTasks = filteredTasks.filter(t => t.status !== ProjectTaskStatus.COMPLETED);
    const completedTasks = filteredTasks.filter(t => t.status === ProjectTaskStatus.COMPLETED);

    return (
        <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-12rem)] bg-bg border border-border overflow-hidden">
            {/* Sidebar - Folders (Desktop) */}
            <div className="hidden md:flex w-64 border-r border-border flex-col">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-gray-500">Folders</h3>
                    <button
                        onClick={() => setIsFolderModalOpen(true)}
                        className="text-accent hover:text-white transition-colors"
                    >
                        <Icons.Plus />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <button
                        onClick={() => { setActiveFolderId(null); setView('MY_TASKS'); }}
                        className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${!activeFolderId && view === 'MY_TASKS' ? 'bg-accent text-black' : 'text-gray-400 hover:bg-muted'}`}
                    >
                        My Tasks
                    </button>
                    {user.role === UserRole.ADMIN && (
                        <button
                            onClick={() => { setActiveFolderId(null); setView('ADMIN'); }}
                            className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${!activeFolderId && view === 'ADMIN' ? 'bg-accent text-black' : 'text-gray-400 hover:bg-muted'}`}
                        >
                            Admin Overview
                        </button>
                    )}
                    <div className="my-4 border-t border-border/50 mx-2" />
                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => { setActiveFolderId(folder.id); setView('FOLDER'); }}
                            className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between ${activeFolderId === folder.id ? 'bg-white text-black' : 'text-gray-400 hover:bg-muted'}`}
                        >
                            <span>{folder.name}</span>
                            {folder.visibility === FolderVisibility.PRIVATE && <Icons.Shield />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Horizontal Folder Navigation */}
            <div className="md:hidden border-b border-border bg-muted/30 px-2 py-3">
                <div className="flex items-center justify-between mb-3 px-2">
                    <h3 className="text-[8px] uppercase font-black tracking-[0.2em] text-gray-500">Navigation</h3>
                    <button
                        onClick={() => setIsFolderModalOpen(true)}
                        className="text-accent text-xs p-1"
                    >
                        <Icons.Plus />
                    </button>
                </div>
                <div className="flex overflow-x-auto pb-2 -mx-2 px-2 space-x-2 no-scrollbar scroll-smooth">
                    <button
                        onClick={() => { setActiveFolderId(null); setView('MY_TASKS'); }}
                        className={`whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${!activeFolderId && view === 'MY_TASKS' ? 'bg-accent border-accent text-black' : 'border-border text-gray-400'}`}
                    >
                        My Tasks
                    </button>
                    {user.role === UserRole.ADMIN && (
                        <button
                            onClick={() => { setActiveFolderId(null); setView('ADMIN'); }}
                            className={`whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${!activeFolderId && view === 'ADMIN' ? 'bg-white border-white text-black' : 'border-border text-gray-400'}`}
                        >
                            Admin
                        </button>
                    )}
                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => { setActiveFolderId(folder.id); setView('FOLDER'); }}
                            className={`whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${activeFolderId === folder.id ? 'bg-white border-white text-black' : 'border-border text-gray-400'}`}
                        >
                            {folder.name}
                            {folder.visibility === FolderVisibility.PRIVATE && <Icons.Shield className="w-3 h-3" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content - Task List */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">
                            {activeFolderId ? folders.find(f => f.id === activeFolderId)?.name : (view === 'ADMIN' ? 'All Tasks' : 'My Assigned Tasks')}
                        </h2>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                            {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'} Total
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                        className="bg-accent text-black px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-colors flex items-center"
                    >
                        <Icons.Plus /> <span className="ml-2">Create Task</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-500 animate-pulse">Loading Tasks...</p>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-border py-20">
                            <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">No tasks found here.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Active Tasks Section */}
                            <div className="space-y-4">
                                {activeTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        user={user}
                                        users={users}
                                        onEdit={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                                        onRefresh={fetchData}
                                    />
                                ))}
                            </div>

                            {/* Completed Tasks Section */}
                            {completedTasks.length > 0 && (
                                <div className="pt-8 border-t border-border/30">
                                    <button
                                        onClick={() => setShowCompleted(!showCompleted)}
                                        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-accent transition-colors mb-6"
                                    >
                                        <div className={`transition-transform ${showCompleted ? 'rotate-90' : ''}`}>
                                            <Icons.ChevronRight />
                                        </div>
                                        Completed Tasks ({completedTasks.length})
                                    </button>

                                    {showCompleted && (
                                        <div className="space-y-4 opacity-70">
                                            {completedTasks.map(task => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    user={user}
                                                    users={users}
                                                    onEdit={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                                                    onRefresh={fetchData}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Creation Modal */}
            {isTaskModalOpen && (
                <TaskModal
                    isOpen={isTaskModalOpen}
                    onClose={() => setIsTaskModalOpen(false)}
                    onSave={async (taskData) => {
                        const taskId = editingTask?.id || Math.random().toString(36).substr(2, 9);
                        await storageService.saveTask({
                            ...taskData,
                            id: taskId,
                            createdAt: editingTask?.createdAt || new Date().toISOString()
                        } as ProjectTask);
                        setIsTaskModalOpen(false);
                        fetchData();
                    }}
                    users={users}
                    currentUserId={user.id}
                    initialData={editingTask}
                    activeFolderId={activeFolderId}
                />
            )}

            {/* Folder Creation Modal */}
            {isFolderModalOpen && (
                <FolderModal
                    isOpen={isFolderModalOpen}
                    onClose={() => setIsFolderModalOpen(false)}
                    onSave={async (folderData) => {
                        const folderId = Math.random().toString(36).substr(2, 9);
                        await storageService.saveFolder({
                            ...folderData,
                            id: folderId,
                            ownerId: user.id,
                            type: user.role === UserRole.ADMIN ? FolderType.ADMIN : FolderType.USER,
                            createdAt: new Date().toISOString()
                        } as TaskFolder);
                        setIsFolderModalOpen(false);
                        fetchData();
                    }}
                    users={users}
                    isAdmin={user.role === UserRole.ADMIN}
                />
            )}
        </div>
    );
};

// Simplified Internal Modals for speed/cohesion
const TaskModal = ({ isOpen, onClose, onSave, users, currentUserId, initialData, activeFolderId }: any) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        client: initialData?.client || '',
        assignedUserId: initialData?.assignedUserId || currentUserId,
        collaboratorIds: initialData?.collaboratorIds || [],
        isCollaborative: initialData?.isCollaborative || false,
        folderId: initialData?.folderId || activeFolderId || null,
        startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
        endDate: initialData?.endDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        timeEstimate: initialData?.timeEstimate || 4,
        status: initialData?.status || ProjectTaskStatus.NOT_STARTED,
        priority: initialData?.priority || ProjectTaskPriority.MEDIUM
    });

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-bg border border-border w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase text-white">{initialData ? 'Edit Task' : 'New Strategic Task'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><Icons.X /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Task Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-muted border border-border p-3 text-white outline-none focus:border-accent font-bold"
                                placeholder="E.G. Q1 FINANCIAL AUDIT"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-muted border border-border p-3 text-white outline-none focus:border-accent h-24 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Client Name</label>
                            <input
                                type="text"
                                value={formData.client}
                                onChange={e => setFormData({ ...formData, client: e.target.value })}
                                className="w-full bg-muted border border-border p-3 text-white outline-none focus:border-accent font-bold uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Assigned User</label>
                            <select
                                value={formData.assignedUserId}
                                onChange={e => setFormData({ ...formData, assignedUserId: e.target.value })}
                                className="w-full bg-muted border border-border p-3 text-white outline-none focus:border-accent font-bold uppercase"
                            >
                                {users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>

                        <div className="col-span-2">
                            <div className="flex items-center justify-between p-4 bg-muted/50 border border-border">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Collaborative Task</h4>
                                    <p className="text-[8px] text-gray-500 uppercase mt-1">Enable to assign multiple team members to this task</p>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, isCollaborative: !formData.isCollaborative, collaboratorIds: !formData.isCollaborative ? formData.collaboratorIds : [] })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${formData.isCollaborative ? 'bg-accent' : 'bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isCollaborative ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        {formData.isCollaborative && (
                            <div className="col-span-2">
                                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Select Collaborators</label>
                                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-muted border border-border">
                                    {users.filter((u: User) => u.id !== formData.assignedUserId).map((u: User) => (
                                        <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-bg cursor-pointer transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={formData.collaboratorIds.includes(u.id)}
                                                onChange={e => {
                                                    const ids = e.target.checked
                                                        ? [...formData.collaboratorIds, u.id]
                                                        : formData.collaboratorIds.filter((id: string) => id !== u.id);
                                                    setFormData({ ...formData, collaboratorIds: ids });
                                                }}
                                                className="accent-accent"
                                            />
                                            <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase">{u.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Start Date</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full bg-muted border border-border p-3 text-white outline-none focus:border-accent font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">End Date (Deadline)</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full bg-muted border border-border p-3 text-white outline-none focus:border-accent font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Estimate (Hours)</label>
                            <input
                                type="number"
                                value={formData.timeEstimate}
                                onChange={e => setFormData({ ...formData, timeEstimate: Number(e.target.value) })}
                                className="w-full bg-muted border border-border p-3 text-white outline-none focus:border-accent font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full bg-muted border border-border p-3 text-white outline-none focus:border-accent font-bold uppercase"
                            >
                                <option value={ProjectTaskPriority.LOW}>Low</option>
                                <option value={ProjectTaskPriority.MEDIUM}>Medium</option>
                                <option value={ProjectTaskPriority.HIGH}>High</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-border flex justify-end gap-4 bg-muted/30">
                    <button onClick={onClose} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={() => onSave(formData)}
                        className="bg-accent text-black px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-colors"
                    >
                        {initialData ? 'Update Task' : 'Confirm Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const FolderModal = ({ isOpen, onClose, onSave, users, isAdmin }: any) => {
    const [formData, setFormData] = useState({
        name: '',
        visibility: FolderVisibility.PUBLIC,
        accessibleUserIds: [] as string[]
    });

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-bg border border-border w-full max-w-md flex flex-col">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase text-white">Create Repository</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><Icons.X /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Folder Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-muted border border-border p-3 text-white outline-none focus:border-accent font-bold"
                            placeholder="PROJECT X"
                        />
                    </div>
                    {isAdmin && (
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Visibility Control</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[FolderVisibility.PUBLIC, FolderVisibility.PRIVATE, FolderVisibility.SELECTIVE].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setFormData({ ...formData, visibility: v })}
                                        className={`p-2 text-[8px] font-black uppercase tracking-tighter border ${formData.visibility === v ? 'bg-accent text-black border-accent' : 'bg-muted border-border text-gray-500'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {isAdmin && formData.visibility === FolderVisibility.SELECTIVE && (
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-black">Grant Access</label>
                            <div className="max-h-32 overflow-y-auto border border-border bg-muted p-2 space-y-1">
                                {users.map((u: User) => (
                                    <label key={u.id} className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400 p-1 hover:bg-bg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.accessibleUserIds.includes(u.id)}
                                            onChange={e => {
                                                const ids = e.target.checked
                                                    ? [...formData.accessibleUserIds, u.id]
                                                    : formData.accessibleUserIds.filter(id => id !== u.id);
                                                setFormData({ ...formData, accessibleUserIds: ids });
                                            }}
                                            className="accent-accent"
                                        />
                                        {u.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-border flex justify-end gap-4 bg-muted/30">
                    <button onClick={onClose} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={() => onSave(formData)}
                        className="bg-accent text-black px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-colors"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

const TaskCard = ({ task, user, users, onEdit, onRefresh }: any) => {
    const isCompleted = task.status === ProjectTaskStatus.COMPLETED;

    const toggleComplete = async () => {
        const newStatus = isCompleted ? ProjectTaskStatus.IN_PROGRESS : ProjectTaskStatus.COMPLETED;
        await storageService.saveTask({ ...task, status: newStatus });
        onRefresh();
    };

    return (
        <div className={`bg-muted border border-border p-5 group transition-all ${isCompleted ? 'border-border/30 grayscale-[0.8]' : 'hover:border-accent'}`}>
            <div className="flex items-start gap-4">
                <button
                    onClick={toggleComplete}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-accent border-accent text-black' : 'border-border hover:border-accent text-transparent'}`}
                >
                    <Icons.Check />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`text-[7px] md:text-[8px] font-black px-2 py-0.5 uppercase tracking-widest border ${task.priority === ProjectTaskPriority.HIGH ? 'bg-red-500/10 border-red-500 text-red-500' :
                                    task.priority === ProjectTaskPriority.MEDIUM ? 'bg-accent/10 border-accent text-accent' :
                                        'bg-gray-500/10 border-gray-500 text-gray-500'
                                    }`}>
                                    {task.priority}
                                </span>
                                <span className="text-[7px] md:text-[8px] font-black px-2 py-0.5 uppercase tracking-widest border border-border bg-bg text-gray-400 truncate max-w-[100px]">
                                    {task.client}
                                </span>
                                {task.isCollaborative && (
                                    <span className="text-[7px] md:text-[8px] font-black px-2 py-0.5 uppercase tracking-widest border border-accent/30 bg-accent/5 text-accent flex items-center gap-1">
                                        <Icons.Shield className="w-2 h-2" /> COLLAB
                                    </span>
                                )}
                            </div>
                            <h4 className={`text-base md:text-lg font-black uppercase leading-tight group-hover:text-accent transition-colors break-words ${isCompleted ? 'line-through text-gray-500' : ''}`}>{task.title}</h4>
                            <p className="text-[11px] md:text-xs text-gray-500 mt-2 line-clamp-2 max-w-full">{task.description}</p>
                        </div>
                        <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3">
                            <select
                                value={task.status}
                                onChange={(e) => {
                                    const newStatus = e.target.value as ProjectTaskStatus;
                                    storageService.saveTask({ ...task, status: newStatus }).then(onRefresh);
                                }}
                                className="bg-bg border border-border text-[9px] md:text-[10px] font-black uppercase tracking-widest p-2 outline-none focus:border-accent transition-colors flex-1 md:flex-none"
                            >
                                <option value={ProjectTaskStatus.NOT_STARTED}>Not Started</option>
                                <option value={ProjectTaskStatus.IN_PROGRESS}>In Progress</option>
                                <option value={ProjectTaskStatus.COMPLETED}>Completed</option>
                            </select>
                            <div className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                {task.timeEstimate}h Est.
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center">
                                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[8px] font-black text-black">
                                    {users.find((u: any) => u.id === task.assignedUserId)?.name.charAt(0)}
                                </div>
                                <span className="ml-2 text-[10px] font-bold text-gray-400 uppercase truncate max-w-[80px]">{users.find((u: any) => u.id === task.assignedUserId)?.name}</span>
                            </div>
                            {task.collaboratorIds.length > 0 && (
                                <div className="flex -space-x-2">
                                    {task.collaboratorIds.map((cid: any) => (
                                        <div key={cid} title={users.find((u: any) => u.id === cid)?.name} className="w-5 h-5 rounded-full bg-border border border-bg flex items-center justify-center text-[8px] font-black text-gray-400">
                                            {users.find((u: any) => u.id === cid)?.name.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                            <div className="flex items-center text-[10px] text-gray-500">
                                <Icons.Calendar className="w-3 h-3 mr-1" />
                                <span className="uppercase font-bold tracking-widest">{new Date(task.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                            {(user.id === task.assignedUserId || user.role === UserRole.ADMIN) && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={onEdit}
                                        className="text-gray-500 hover:text-white transition-colors"
                                    >
                                        <Icons.ChevronRight />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("Delete this task?")) {
                                                await storageService.deleteTask(task.id);
                                                onRefresh();
                                            }
                                        }}
                                        className="text-gray-600 hover:text-red-500 transition-colors"
                                    >
                                        <Icons.Trash />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskSystem;

