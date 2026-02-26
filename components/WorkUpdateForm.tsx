
import React, { useState, useEffect } from 'react';
import { Icons, CATEGORY_LABELS } from '../constants';
import { Task, MissedTask, Blocker, TaskCategory, DailyWorkUpdate, User, ProjectTask } from '../types';
import { storageService } from '../services/storageService';

interface WorkUpdateFormProps {
  user: User;
  onSubmit: (update: DailyWorkUpdate) => Promise<void>;
  onCancel: () => void;
}


interface TaskForm extends Task {
  hours: number;
  minutes: number;
}

const WorkUpdateForm: React.FC<WorkUpdateFormProps> = ({ user, onSubmit, onCancel }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<TaskForm[]>([{
    id: '1',
    description: '',
    timeSpent: 0,
    hours: 0,
    minutes: 0,
    category: TaskCategory.HPA
  }]);
  const [missedTasks, setMissedTasks] = useState<MissedTask[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [productivityScore, setProductivityScore] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);

  useEffect(() => {
    storageService.getTasksByUser(user.id).then(setProjectTasks);
  }, [user.id]);

  const totalTime = tasks.reduce((acc, t) => acc + (Number(t.timeSpent) || 0), 0);
  const totalHours = Math.floor(totalTime);
  const totalMinutes = Math.round((totalTime - totalHours) * 60);

  const addTask = () => {
    setTasks([...tasks, {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      timeSpent: 0,
      hours: 0,
      minutes: 0,
      category: TaskCategory.HPA
    }]);
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const updateTask = (id: string, field: keyof TaskForm, value: any) => {
    setTasks(tasks.map(t => {
      if (t.id !== id) return t;

      const updatedTask = { ...t, [field]: value };

      if (field === 'hours' || field === 'minutes') {
        const h = field === 'hours' ? Number(value) : t.hours;
        const m = field === 'minutes' ? Number(value) : t.minutes;
        updatedTask.timeSpent = h + (m / 60);
      }

      return updatedTask;
    }));
  };

  const linkProjectTask = (taskId: string, targetId: string) => {
    const pt = projectTasks.find(t => t.id === taskId);
    if (!pt) return;

    setTasks(tasks.map(t => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        description: `[${pt.client}] ${pt.title}`,
        category: TaskCategory.HPA // Default to HPA for linked tasks
      };
    }));
  };

  // ... (missed tasks and blockers logic remains the same)
  const addMissedTask = () => {
    setMissedTasks([...missedTasks, { id: Math.random().toString(36).substr(2, 9), description: '', reason: '' }]);
  };

  const removeMissedTask = (id: string) => {
    setMissedTasks(missedTasks.filter(m => m.id !== id));
  };

  const updateMissedTask = (id: string, field: keyof MissedTask, value: string) => {
    setMissedTasks(missedTasks.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addBlocker = () => {
    setBlockers([...blockers, { id: Math.random().toString(36).substr(2, 9), description: '', reason: '' }]);
  };

  const removeBlocker = (id: string) => {
    setBlockers(blockers.filter(b => b.id !== id));
  };

  const updateBlocker = (id: string, field: keyof Blocker, value: string) => {
    setBlockers(blockers.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tasks.some(t => !t.description || t.timeSpent <= 0)) {
      alert('Please fill in all task details.');
      return;
    }

    setIsSubmitting(true);
    const update: DailyWorkUpdate = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      date,
      month: date.substring(0, 7),
      tasks: tasks.map(({ hours, minutes, ...t }) => t), // Remove extra fields before submitting
      missedTasks,
      blockers,
      productivityScore,
      totalTime,
      submittedAt: new Date().toISOString()
    };

    try {
      await onSubmit(update);
    } catch (error) {
      console.error("Error submitting update:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12 max-w-4xl mx-auto">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Daily Work Log</h2>
          <p className="text-gray-500 mt-2">Log your impact for the day.</p>
        </div>
        <div className="w-48">
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-muted border border-border rounded-none p-3 focus:border-accent outline-none text-white text-sm"
            required
          />
        </div>
      </div>

      {/* Tasks Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold uppercase tracking-widest flex items-center">
            <span className="w-8 h-8 bg-accent text-black flex items-center justify-center mr-3 text-xs">01</span>
            Tasks Completed
          </h3>
          <button
            type="button"
            onClick={addTask}
            className="text-xs uppercase font-bold text-accent flex items-center hover:opacity-80 transition-opacity"
          >
            <Icons.Plus /> <span className="ml-1">Add Task</span>
          </button>
        </div>

        <div className="space-y-4">
          {tasks.map((task, idx) => (
            <div key={task.id} className="grid grid-cols-12 gap-4 items-start p-4 bg-muted border border-border">
              <div className="col-span-12 md:col-span-5">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Task Description</label>
                <input
                  type="text"
                  value={task.description}
                  onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                  placeholder="What did you work on?"
                  required
                />
                <div className="mt-2">
                  <select
                    className="w-full bg-muted border border-border border-dashed p-1.5 text-[8px] uppercase font-black tracking-widest text-gray-400 outline-none focus:border-accent transition-colors"
                    onChange={(e) => linkProjectTask(e.target.value, task.id)}
                    value=""
                  >
                    <option value="">+ Link Project Task</option>
                    {projectTasks.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.client}: {pt.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-6 md:col-span-3 flex space-x-2">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Hrs</label>
                  <input
                    type="number"
                    min="0"
                    value={task.hours}
                    onChange={(e) => updateTask(task.id, 'hours', parseInt(e.target.value) || 0)}
                    className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Mins</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={task.minutes}
                    onChange={(e) => updateTask(task.id, 'minutes', parseInt(e.target.value) || 0)}
                    className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                    required
                  />
                </div>
              </div>
              <div className="col-span-6 md:col-span-3">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Category</label>
                <select
                  value={task.category}
                  onChange={(e) => updateTask(task.id, 'category', e.target.value as TaskCategory)}
                  className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                  required
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-12 md:col-span-1 flex items-end justify-end h-full pt-4">
                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  disabled={tasks.length === 1}
                  className="text-gray-500 hover:text-red-500 transition-colors disabled:opacity-30"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <div className="bg-muted p-4 border border-border inline-block min-w-[200px]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Total Hours</p>
            <p className="text-3xl font-black text-accent">{totalHours}h {totalMinutes}m</p>
          </div>
        </div>
      </section>

      {/* Missed Tasks */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold uppercase tracking-widest flex items-center">
            <span className="w-8 h-8 bg-border text-white flex items-center justify-center mr-3 text-xs">02</span>
            Missed Tasks (Optional)
          </h3>
          <button
            type="button"
            onClick={addMissedTask}
            className="text-xs uppercase font-bold text-white flex items-center hover:opacity-80 transition-opacity"
          >
            <Icons.Plus /> <span className="ml-1 text-gray-300">Add Missed</span>
          </button>
        </div>

        <div className="space-y-4">
          {missedTasks.map((m) => (
            <div key={m.id} className="grid grid-cols-12 gap-4 items-start p-4 bg-muted/50 border border-border border-dashed">
              <div className="col-span-12 md:col-span-6">
                <input
                  type="text"
                  placeholder="What was missed?"
                  value={m.description}
                  onChange={(e) => updateMissedTask(m.id, 'description', e.target.value)}
                  className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                />
              </div>
              <div className="col-span-11 md:col-span-5">
                <input
                  type="text"
                  placeholder="Why was it missed?"
                  value={m.reason}
                  onChange={(e) => updateMissedTask(m.id, 'reason', e.target.value)}
                  className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end h-full pt-1">
                <button type="button" onClick={() => removeMissedTask(m.id)} className="text-gray-500 hover:text-red-500">
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Blockers */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold uppercase tracking-widest flex items-center">
            <span className="w-8 h-8 bg-border text-white flex items-center justify-center mr-3 text-xs">03</span>
            Blockers Faced
          </h3>
          <button
            type="button"
            onClick={addBlocker}
            className="text-xs uppercase font-bold text-white flex items-center hover:opacity-80 transition-opacity"
          >
            <Icons.Plus /> <span className="ml-1 text-gray-300">Add Blocker</span>
          </button>
        </div>

        <div className="space-y-4">
          {blockers.map((b) => (
            <div key={b.id} className="grid grid-cols-12 gap-4 items-start p-4 bg-muted/50 border border-border border-dashed">
              <div className="col-span-12 md:col-span-6">
                <input
                  type="text"
                  placeholder="Description of the blocker"
                  value={b.description}
                  onChange={(e) => updateBlocker(b.id, 'description', e.target.value)}
                  className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                />
              </div>
              <div className="col-span-11 md:col-span-5">
                <input
                  type="text"
                  placeholder="Root cause"
                  value={b.reason}
                  onChange={(e) => updateBlocker(b.id, 'reason', e.target.value)}
                  className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end h-full pt-1">
                <button type="button" onClick={() => removeBlocker(b.id)} className="text-gray-500 hover:text-red-500">
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Score */}
      <section className="border-t border-border pt-12">
        <div className="max-w-md">
          <label className="block text-lg font-bold uppercase tracking-widest mb-4">
            Productivity Score (1-10)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="10"
              value={productivityScore}
              onChange={(e) => setProductivityScore(parseInt(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="text-5xl font-black text-accent w-16 text-center">{productivityScore}</span>
          </div>
          <p className="text-gray-500 text-xs mt-4 italic uppercase tracking-wider">
            Be honest. This is about output, not hours.
          </p>
        </div>
      </section>

      <div className="flex items-center justify-end space-x-4 pt-12 pb-24 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-12 py-4 bg-accent text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Log'}
        </button>
      </div>
    </form>
  );
};

export default WorkUpdateForm;
