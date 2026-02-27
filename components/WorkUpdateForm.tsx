
import React, { useState, useEffect } from 'react';
import { Icons, CATEGORY_LABELS } from '../constants';
import { Task, MissedTask, Blocker, TaskCategory, DailyWorkUpdate, User, ProjectTask, ProjectTaskStatus } from '../types';
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
    category: TaskCategory.HPA,
    projectTaskId: ''
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
      category: TaskCategory.HPA,
      projectTaskId: ''
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

      // If selecting a project task, pre-fill description and category
      if (field === 'projectTaskId' && value !== 'custom') {
        const pt = projectTasks.find(p => p.id === value);
        if (pt) {
          updatedTask.description = `[${pt.client}] ${pt.title}`;
          updatedTask.category = TaskCategory.HPA; // Default to HPA
        }
      }

      return updatedTask;
    }));
  };

  const addMissedTask = () => {
    setMissedTasks([...missedTasks, { id: Math.random().toString(36).substr(2, 9), description: '', reason: '', projectTaskId: '' }]);
  };

  const removeMissedTask = (id: string) => {
    setMissedTasks(missedTasks.filter(m => m.id !== id));
  };

  const updateMissedTask = (id: string, field: keyof MissedTask, value: string) => {
    setMissedTasks(missedTasks.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, [field]: value };
      if (field === 'projectTaskId' && value !== 'custom') {
        const pt = projectTasks.find(p => p.id === value);
        if (pt) {
          updated.description = `[${pt.client}] ${pt.title}`;
        }
      }
      return updated;
    }));
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Daily Work Log</h2>
          <p className="text-gray-500 mt-2 text-sm md:text-base">Log your impact for the day.</p>
        </div>
        <div className="w-full md:w-48">
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
            <div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 bg-muted border border-border">
              <div className="md:col-span-12 lg:col-span-5">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Select Task Source</label>
                <select
                  value={task.projectTaskId || (task.description ? 'custom' : '')}
                  onChange={(e) => updateTask(task.id, 'projectTaskId', e.target.value)}
                  className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm mb-2"
                  required
                >
                  <option value="">-- Choose a Task --</option>
                  <option value="custom">+ New/Additional Task (Type below)</option>
                  {projectTasks.filter(pt => pt.status !== ProjectTaskStatus.COMPLETED).map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.client}: {pt.title}</option>
                  ))}
                </select>

                {(task.projectTaskId === 'custom' || !task.projectTaskId) && (
                  <>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 mt-2">Task Description</label>
                    <input
                      type="text"
                      className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                      value={task.description}
                      onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                      placeholder="What did you work on?"
                      required={task.projectTaskId === 'custom'}
                    />
                  </>
                )}

                {task.projectTaskId && task.projectTaskId !== 'custom' && (
                  <div className="p-2 bg-accent/5 border border-accent/20 text-[10px] font-bold text-accent uppercase tracking-wider">
                    Linked: {task.description}
                  </div>
                )}
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
              <div className="md:col-span-3">
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
              <div className="md:col-span-1 flex items-end justify-end h-full pt-4">
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
            <div key={m.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 bg-muted/50 border border-border border-dashed">
              <div className="md:col-span-6">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Missed Task Source</label>
                <select
                  value={m.projectTaskId || (m.description ? 'custom' : '')}
                  onChange={(e) => updateMissedTask(m.id, 'projectTaskId', e.target.value)}
                  className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm mb-2"
                >
                  <option value="">-- Choose a Task --</option>
                  <option value="custom">+ New/Additional Task (Type below)</option>
                  {projectTasks.filter(pt => pt.status !== ProjectTaskStatus.COMPLETED).map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.client}: {pt.title}</option>
                  ))}
                </select>

                {(m.projectTaskId === 'custom' || !m.projectTaskId) && (
                  <input
                    type="text"
                    placeholder="What was missed?"
                    value={m.description}
                    onChange={(e) => updateMissedTask(m.id, 'description', e.target.value)}
                    className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                  />
                )}

                {m.projectTaskId && m.projectTaskId !== 'custom' && (
                  <div className="p-2 bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Linked: {m.description}
                  </div>
                )}
              </div>
              <div className="md:col-span-5 pt-0 md:pt-5">
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
            <div key={b.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 bg-muted/50 border border-border border-dashed">
              <div className="md:col-span-6">
                <input
                  type="text"
                  placeholder="Description of the blocker"
                  value={b.description}
                  onChange={(e) => updateBlocker(b.id, 'description', e.target.value)}
                  className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                />
              </div>
              <div className="md:col-span-5">
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
