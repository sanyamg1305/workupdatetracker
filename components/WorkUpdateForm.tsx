
import React, { useState, useEffect } from 'react';
import { Icons, CATEGORY_LABELS, ACCENT_COLOR } from '../constants';
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
  isMissed?: boolean;
  missedReason?: string;
}

const WorkUpdateForm: React.FC<WorkUpdateFormProps> = ({ user, onSubmit, onCancel }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<TaskForm[]>([]);
  const [missedTasks, setMissedTasks] = useState<MissedTask[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [productivityScore, setProductivityScore] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);

  useEffect(() => {
    storageService.getTasksByUser(user.id).then(setProjectTasks);
  }, [user.id]);

  useEffect(() => {
    if (!projectTasks.length) return;
    
    const scheduled = projectTasks.filter(pt => 
       pt.status !== ProjectTaskStatus.COMPLETED &&
       pt.startDate <= date && 
       pt.endDate >= date
    );
    
    setTasks(prev => {
       const manual = prev.filter(t => !t.isScheduled);
       const newScheduled = scheduled.map(pt => {
           const existing = prev.find(p => p.projectTaskId === pt.id && p.isScheduled);
           if (existing) return existing;
           
           return {
               id: Math.random().toString(36).substr(2, 9),
               description: `[${pt.client}] ${pt.title}`,
               timeSpent: 0,
               hours: 0,
               minutes: 0,
               category: TaskCategory.HPA,
               projectTaskId: pt.id,
               isScheduled: true,
               estimatedTimeAtLogDate: pt.timeEstimate,
               variance: -pt.timeEstimate,
               statusAtSubmission: pt.status,
               isMissed: false,
               missedReason: ''
           };
       });
       return [...newScheduled, ...manual];
    });
  }, [projectTasks, date]);

  const totalTime = tasks.reduce((acc, t) => acc + (Number(t.timeSpent) || 0), 0);
  const totalHours = Math.floor(totalTime);
  const totalMinutes = Math.round((totalTime - totalHours) * 60);

  const scheduledTasks = tasks.filter(t => t.isScheduled);
  const manualTasks = tasks.filter(t => !t.isScheduled);

  const activeScheduledTasks = scheduledTasks.filter(t => !t.isMissed);

  const totalScheduledEst = activeScheduledTasks.reduce((acc, t) => acc + (t.estimatedTimeAtLogDate || 0), 0);
  const totalScheduledActual = activeScheduledTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const totalScheduledVariance = totalScheduledActual - totalScheduledEst;

  const addTask = () => {
    setTasks([...tasks, {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      timeSpent: 0,
      hours: 0,
      minutes: 0,
      category: TaskCategory.HPA,
      projectTaskId: '',
      isScheduled: false
    }]);
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTask = (id: string, field: keyof TaskForm, value: any) => {
    setTasks(tasks.map(t => {
      if (t.id !== id) return t;

      const updatedTask = { ...t, [field]: value };

      if (field === 'hours' || field === 'minutes') {
        const h = field === 'hours' ? Number(value) : t.hours;
        const m = field === 'minutes' ? Number(value) : t.minutes;
        const timeSpent = h + (m / 60);
        updatedTask.timeSpent = timeSpent;
        
        if (updatedTask.isScheduled && updatedTask.estimatedTimeAtLogDate !== undefined) {
             updatedTask.variance = timeSpent - updatedTask.estimatedTimeAtLogDate;
        }
      }

      if (field === 'isMissed' && value === true) {
        updatedTask.hours = 0;
        updatedTask.minutes = 0;
        updatedTask.timeSpent = 0;
      }

      if (field === 'projectTaskId' && value !== 'custom' && !t.isScheduled) {
        const pt = projectTasks.find(p => p.id === value);
        if (pt) {
          updatedTask.description = `[${pt.client}] ${pt.title}`;
          updatedTask.category = TaskCategory.HPA;
        }
      }

      return updatedTask;
    }));
  };

  const addMissedTask = () => setMissedTasks([...missedTasks, { id: Math.random().toString(36).substr(2, 9), description: '', reason: '', projectTaskId: '' }]);
  const removeMissedTask = (id: string) => setMissedTasks(missedTasks.filter(m => m.id !== id));
  const updateMissedTask = (id: string, field: keyof MissedTask, value: string) => {
    setMissedTasks(missedTasks.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, [field]: value };
      if (field === 'projectTaskId' && value !== 'custom') {
        const pt = projectTasks.find(p => p.id === value);
        if (pt) updated.description = `[${pt.client}] ${pt.title}`;
      }
      return updated;
    }));
  };

  const addBlocker = () => setBlockers([...blockers, { id: Math.random().toString(36).substr(2, 9), description: '', reason: '' }]);
  const removeBlocker = (id: string) => setBlockers(blockers.filter(b => b.id !== id));
  const updateBlocker = (id: string, field: keyof Blocker, value: string) => setBlockers(blockers.map(b => b.id === id ? { ...b, [field]: value } : b));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTasks.some(t => !t.description || t.timeSpent <= 0)) {
      alert('Please fill in all details for your manual tasks.');
      return;
    }

    setIsSubmitting(true);

    const finalTasks: Task[] = [];
    const finalMissed = [...missedTasks];
    
    tasks.forEach(({ hours, minutes, isMissed, missedReason, ...t }) => {
        if (isMissed) {
             finalMissed.push({
                  id: Math.random().toString(36).substr(2, 9),
                  description: t.description,
                  reason: missedReason || 'Missed scheduled task',
                  projectTaskId: t.projectTaskId
             });
        } else {
             finalTasks.push(t as Task);
        }
    });

    const update: DailyWorkUpdate = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      date,
      month: date.substring(0, 7),
      tasks: finalTasks,
      missedTasks: finalMissed,
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
          <p className="text-gray-500 mt-2 text-sm md:text-base">Log your impact for the day based on planned and reactive work.</p>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Log Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-muted border border-border rounded-none p-3 focus:border-accent outline-none text-white text-sm font-bold"
            required
          />
        </div>
      </div>

      {/* SECTION 2: SCHEDULED TASKS */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold uppercase tracking-widest flex items-center">
            <span className="w-8 h-8 bg-accent text-black flex items-center justify-center mr-3 text-xs">01</span>
            Scheduled Work
          </h3>
        </div>

        {scheduledTasks.length === 0 ? (
           <div className="p-8 border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center">
               <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">No planned tasks scheduled for this day.</p>
           </div>
        ) : (
           <div className="space-y-4">
               {scheduledTasks.map((task) => (
                   <div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-muted border border-border hover:border-accent transition-colors">
                       <div className="md:col-span-12 lg:col-span-6">
                           <div className="flex flex-col">
                               <div className="flex justify-between items-start mb-1">
                                   <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Target</span>
                                   <label className="flex items-center gap-2 cursor-pointer group">
                                       <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 group-hover:text-red-500 transition-colors">Mark Missed</span>
                                       <input 
                                           type="checkbox" 
                                           checked={task.isMissed || false}
                                           onChange={(e) => updateTask(task.id, 'isMissed', e.target.checked)}
                                           className="accent-red-500 w-3 h-3"
                                       />
                                   </label>
                               </div>
                               <span className={`text-white font-bold uppercase truncate transition-all ${task.isMissed ? 'line-through opacity-50' : ''}`}>{task.description}</span>
                               {!task.isMissed ? (
                                   <div className="flex items-center gap-4 mt-2">
                                       <div className="flex items-center gap-1">
                                           <span className="text-[10px] uppercase tracking-widest text-gray-500">Est:</span>
                                           <span className="text-[10px] uppercase tracking-widest font-black text-white">{task.estimatedTimeAtLogDate?.toFixed(1)}h</span>
                                       </div>
                                       <div className="flex items-center gap-1">
                                           <span className="text-[10px] uppercase tracking-widest text-gray-500">Var:</span>
                                           <span className={`text-[10px] uppercase tracking-widest font-black ${(task.variance || 0) > 0 ? 'text-red-500' : (task.variance || 0) < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                               {(task.variance || 0) > 0 ? '+' : ''}{(task.variance || 0).toFixed(1)}h
                                           </span>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="mt-2">
                                       <input
                                           type="text"
                                           placeholder="Reason for missing this task?"
                                           value={task.missedReason || ''}
                                           onChange={(e) => updateTask(task.id, 'missedReason', e.target.value)}
                                           className="w-full bg-bg border border-red-500/30 p-2 focus:border-red-500 outline-none text-xs text-white"
                                           required={task.isMissed}
                                       />
                                   </div>
                               )}
                           </div>
                       </div>
                       
                       <div className="md:col-span-6 lg:col-span-3 flex space-x-2">
                           <div className="flex-1">
                               <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Hrs (Act)</label>
                               <input
                                   type="number" min="0" value={task.hours}
                                   onChange={(e) => updateTask(task.id, 'hours', parseInt(e.target.value) || 0)}
                                   className={`w-full bg-bg border border-border p-2 outline-none text-sm font-bold ${task.isMissed ? 'opacity-30 cursor-not-allowed' : 'focus:border-accent'}`}
                                   required={!task.isMissed}
                                   disabled={task.isMissed}
                               />
                           </div>
                           <div className="flex-1">
                               <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Mins</label>
                               <input
                                   type="number" min="0" max="59" value={task.minutes}
                                   onChange={(e) => updateTask(task.id, 'minutes', parseInt(e.target.value) || 0)}
                                   className={`w-full bg-bg border border-border p-2 outline-none text-sm font-bold ${task.isMissed ? 'opacity-30 cursor-not-allowed' : 'focus:border-accent'}`}
                                   required={!task.isMissed}
                                   disabled={task.isMissed}
                               />
                           </div>
                       </div>

                       <div className="md:col-span-6 lg:col-span-3">
                           <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Status</label>
                           <select
                               value={task.statusAtSubmission}
                               onChange={(e) => {
                                   updateTask(task.id, 'statusAtSubmission', e.target.value);
                                   const projectTaskToUpdate = projectTasks.find(p => p.id === task.projectTaskId);
                                   if (projectTaskToUpdate) {
                                       storageService.saveTask({ ...projectTaskToUpdate, status: e.target.value as ProjectTaskStatus });
                                       setProjectTasks(projectTasks.map(p => p.id === task.projectTaskId ? { ...p, status: e.target.value as ProjectTaskStatus } : p));
                                   }
                               }}
                               className={`w-full bg-bg border border-border p-2 outline-none text-[10px] font-black uppercase tracking-widest text-gray-300 ${task.isMissed ? 'opacity-30 cursor-not-allowed' : 'focus:border-accent'}`}
                               disabled={task.isMissed}
                           >
                               <option value={ProjectTaskStatus.NOT_STARTED}>Not Started</option>
                               <option value={ProjectTaskStatus.IN_PROGRESS}>In Progress</option>
                               <option value={ProjectTaskStatus.COMPLETED}>Completed</option>
                           </select>
                       </div>
                   </div>
               ))}
           </div>
        )}
      </section>

      {/* SECTION 3: ADDITIONAL MANUAL TASKS */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold uppercase tracking-widest flex items-center text-gray-400">
            <span className="w-8 h-8 bg-gray-700 text-white flex items-center justify-center mr-3 text-xs">02</span>
            Unplanned Work
          </h3>
          <button type="button" onClick={addTask} className="text-xs uppercase font-bold text-accent flex items-center hover:opacity-80 transition-opacity">
            <Icons.Plus /> <span className="ml-1">Add Manual</span>
          </button>
        </div>

        {manualTasks.length === 0 ? (
            <div className="p-4 border border-border bg-bg/50 flex flex-col items-center justify-center">
               <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-600">No unplanned tasks logged.</p>
           </div>
        ) : (
           <div className="space-y-4">
             {manualTasks.map((task, idx) => (
               <div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 bg-muted/30 border border-border">
                 <div className="md:col-span-12 lg:col-span-5">
                   <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 mt-2">Unplanned Task Description</label>
                   <input
                     type="text"
                     className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                     value={task.description}
                     onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                     placeholder="What reactive/unplanned work took place?"
                     required
                   />
                 </div>
                 <div className="col-span-6 md:col-span-3 flex space-x-2">
                   <div className="flex-1 mt-2">
                     <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Hrs</label>
                     <input
                       type="number" min="0" value={task.hours}
                       onChange={(e) => updateTask(task.id, 'hours', parseInt(e.target.value) || 0)}
                       className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                       required
                     />
                   </div>
                   <div className="flex-1 mt-2">
                     <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Mins</label>
                     <input
                       type="number" min="0" max="59" value={task.minutes}
                       onChange={(e) => updateTask(task.id, 'minutes', parseInt(e.target.value) || 0)}
                       className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                       required
                     />
                   </div>
                 </div>
                 <div className="md:col-span-3 mt-2">
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
                   <button type="button" onClick={() => removeTask(task.id)} className="text-gray-500 hover:text-red-500 transition-colors py-2">
                     <Icons.Trash />
                   </button>
                 </div>
               </div>
             ))}
           </div>
        )}
      </section>

      {/* SECTION 4: Missed Tasks */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold uppercase tracking-widest flex items-center text-gray-500">
            <span className="w-8 h-8 bg-gray-800 text-gray-500 flex items-center justify-center mr-3 text-xs">03</span>
            Missed Tasks
          </h3>
          <button type="button" onClick={addMissedTask} className="text-xs uppercase font-bold text-gray-400 flex items-center hover:opacity-80 transition-opacity">
            <Icons.Plus /> <span className="ml-1">Add Missed</span>
          </button>
        </div>

        <div className="space-y-4">
          {missedTasks.map((m) => (
            <div key={m.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 bg-bg border border-border border-dashed">
              <div className="md:col-span-6">
                <input
                  type="text"
                  placeholder="What was missed?"
                  value={m.description}
                  onChange={(e) => updateMissedTask(m.id, 'description', e.target.value)}
                  className="w-full bg-muted border border-border p-2 focus:border-accent outline-none text-sm"
                />
              </div>
              <div className="md:col-span-5">
                <input
                  type="text"
                  placeholder="Why was it missed?"
                  value={m.reason}
                  onChange={(e) => updateMissedTask(m.id, 'reason', e.target.value)}
                  className="w-full bg-muted border border-border p-2 focus:border-accent outline-none text-sm"
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

      {/* SECTION 5: Blockers */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold uppercase tracking-widest flex items-center text-gray-500">
            <span className="w-8 h-8 bg-gray-800 text-gray-500 flex items-center justify-center mr-3 text-xs">04</span>
            Blockers Faced
          </h3>
          <button type="button" onClick={addBlocker} className="text-xs uppercase font-bold text-gray-400 flex items-center hover:opacity-80 transition-opacity">
            <Icons.Plus /> <span className="ml-1">Add Blocker</span>
          </button>
        </div>

        <div className="space-y-4">
          {blockers.map((b) => (
            <div key={b.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 bg-bg border border-border border-dashed">
              <div className="md:col-span-6">
                <input
                  type="text" placeholder="Description of the blocker" value={b.description}
                  onChange={(e) => updateBlocker(b.id, 'description', e.target.value)}
                  className="w-full bg-muted border border-border p-2 focus:border-accent outline-none text-sm"
                />
              </div>
              <div className="md:col-span-5">
                <input
                  type="text" placeholder="Root cause" value={b.reason}
                  onChange={(e) => updateBlocker(b.id, 'reason', e.target.value)}
                  className="w-full bg-muted border border-border p-2 focus:border-accent outline-none text-sm"
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

      {/* SECTION 6: Score & Summary */}
      <section className="border-t border-border pt-12 pb-8 flex flex-col lg:flex-row gap-8 justify-between">
        <div className="flex-1 max-w-md">
          <label className="block text-lg font-bold uppercase tracking-widest mb-4">
            Productivity Score (1-10)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range" min="1" max="10" value={productivityScore}
              onChange={(e) => setProductivityScore(parseInt(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="text-5xl font-black text-accent w-16 text-center">{productivityScore}</span>
          </div>
          <p className="text-gray-500 text-xs mt-4 italic uppercase tracking-wider">
            Be honest. This is about output, not hours.
          </p>
        </div>

        {/* DAY LEVEL SUMMARY */}
        <div className="flex-none bg-muted p-6 border border-border grid grid-cols-2 lg:grid-cols-4 gap-6 w-full lg:w-auto">
            <div className="col-span-2 lg:col-span-4 border-b border-border/50 pb-2 mb-2">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">Day-Level Summary</p>
            </div>
            <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Total Est.</p>
                <p className="text-xl font-black text-gray-300">{totalScheduledEst.toFixed(1)}h</p>
            </div>
            <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Sched. Actual</p>
                <p className="text-xl font-black text-white">{totalScheduledActual.toFixed(1)}h</p>
            </div>
            <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Variance</p>
                <p className={`text-xl font-black ${totalScheduledVariance > 0 ? 'text-red-500' : totalScheduledVariance < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                    {totalScheduledVariance > 0 ? '+' : ''}{totalScheduledVariance.toFixed(1)}h
                </p>
            </div>
            <div>
                <p className="text-[9px] uppercase tracking-widest text-accent mb-1">Total Logged</p>
                <p className="text-xl font-black text-accent">{totalHours}h {totalMinutes}m</p>
            </div>
        </div>
      </section>

      {/* SECTION 7: Submit */}
      <div className="flex items-center justify-end space-x-4 pt-4 pb-24 border-t border-border">
        <button
          type="button" onClick={onCancel}
          className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={isSubmitting}
          className="px-12 py-4 bg-accent text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Log'}
        </button>
      </div>
    </form>
  );
};

export default WorkUpdateForm;
